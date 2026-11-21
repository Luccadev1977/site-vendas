-- Public contact configuration contains no Pix key, password or customer records.
create table public.site_settings(singleton boolean primary key default true check(singleton),phone text not null default '',message text not null default 'Olá! Encontrei o Nexo Studio e gostaria de conversar sobre a criação de um site.',enabled boolean not null default false,updated_at timestamptz not null default now(),check(phone='' or phone~'^55[0-9]{10,11}$'),check(length(message) between 1 and 1000),check(not enabled or phone<>''));
insert into public.site_settings(singleton) values(true);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from public,anon,authenticated;
grant select on public.site_settings to anon,authenticated;
create policy public_contact_read on public.site_settings for select to anon,authenticated using(true);

-- Keep privileged implementation private. User callers cannot attest uploaded bytes.
create function private.dispatch(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; counter integer; keytype text;
begin
  if action='register_file' then raise exception 'Arquivo deve ser validado pela Edge Function.' using errcode='42501'; end if;
  if action='whatsapp' then
    if auth.uid() is null or not private.is_admin() then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
    if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail.' using errcode='42501'; end if;
    if jsonb_typeof(payload->'phone') is distinct from 'string' or jsonb_typeof(payload->'message') is distinct from 'string' or jsonb_typeof(payload->'enabled') is distinct from 'boolean' or length(payload::text)>5000 then raise exception 'Dados do WhatsApp inválidos.'; end if;
    insert into private.rate_limits(user_id,bucket,count) values(auth.uid(),date_trunc('minute',now()),1) on conflict(user_id,bucket) do update set count=private.rate_limits.count+1 returning count into counter;
    if counter>60 then raise exception 'Limite de ações atingido.'; end if;
    update public.site_settings set phone=payload->>'phone',message=payload->>'message',enabled=(payload->>'enabled')::boolean,updated_at=now() where singleton;
    insert into public.audit_log(actor_id,action,detail) values(auth.uid(),'whatsapp',jsonb_build_object('enabled',payload->'enabled'));
    return '{}'::jsonb;
  end if;
  if action='settings' then
    keytype:=coalesce(payload->>'key_type',case when payload->>'key' like '%@%' then 'email' else 'random' end);
    if keytype not in ('cpf','cnpj','email','phone','random') then raise exception 'Dados do Pix inválidos.'; end if;
    result:=private.execute_command(action,payload);
    update private.settings set pix=pix||jsonb_build_object('key_type',keytype) where singleton;
    return result;
  end if;
  return private.execute_command(action,payload);
end; $$;
revoke all on function private.dispatch(text,jsonb) from public,anon;
grant execute on function private.dispatch(text,jsonb) to authenticated;
create or replace function public.command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.dispatch(action,payload);$$;
revoke all on function private.execute_command(text,jsonb) from authenticated;

-- Called only after Edge Auth and byte inspection. No client role can invoke this.
create function private.finalize_file(actor uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail.' using errcode='42501'; end if;
  perform set_config('request.jwt.claim.sub',actor::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  return private.execute_command('register_file',payload);
end;$$;
create function public.finalize_file(actor uuid,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.finalize_file(actor,payload);$$;
revoke all on function private.finalize_file(uuid,jsonb),public.finalize_file(uuid,jsonb) from public,anon,authenticated;
grant execute on function private.finalize_file(uuid,jsonb),public.finalize_file(uuid,jsonb) to service_role;
