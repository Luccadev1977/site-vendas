-- Additive migration: applying it never archives, trashes or deletes a row.
alter table public.projects add column archived_at timestamptz, add column deleted_at timestamptz;
create index projects_archived on public.projects(archived_at desc) where archived_at is not null and deleted_at is null;
create index projects_deleted on public.projects(deleted_at desc) where deleted_at is not null;

create function private.manage_order(action text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pid uuid; p public.projects; counter integer; timeline jsonb;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
  if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail.' using errcode='42501'; end if;
  if action is null or action not in ('archive_order','trash_order','restore_order','purge_order') or jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>1000 then raise exception 'Dados da operação inválidos.'; end if;
  pid:=(payload->>'id')::uuid;
  if pid is null then raise exception 'Projeto inválido.'; end if;
  insert into private.rate_limits(user_id,bucket,count) values(auth.uid(),date_trunc('minute',now()),1)
    on conflict(user_id,bucket) do update set count=private.rate_limits.count+1 returning count into counter;
  if counter>60 then raise exception 'Limite de ações atingido. Aguarde um minuto.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(pid::text,0));
  select * into p from public.projects where id=pid for update;
  if p.id is null then raise exception 'Projeto não encontrado.'; end if;
  if action='archive_order' then
    if p.deleted_at is not null then raise exception 'Operação indisponível: restaure o pedido da lixeira primeiro.'; end if;
    if p.archived_at is not null then return jsonb_build_object('id',pid); end if;
    update public.projects set archived_at=now() where id=pid;
  elsif action='trash_order' then
    if p.deleted_at is not null then return jsonb_build_object('id',pid); end if;
    update public.projects set deleted_at=now() where id=pid;
  elsif action='restore_order' then
    if p.deleted_at is null and p.archived_at is null then return jsonb_build_object('id',pid); end if;
    update public.projects set archived_at=null,deleted_at=null where id=pid;
  else
    if p.deleted_at is null or payload->>'confirmation' is distinct from p.number then raise exception 'Operação exige pedido na lixeira e confirmação do número.'; end if;
    if p.status not in ('cancelled','rejected','draft') then raise exception 'Operação bloqueada: encerre o pedido antes da exclusão definitiva.'; end if;
    if exists(select 1 from pg_catalog.pg_constraint where contype='f' and confrelid='public.projects'::regclass and conrelid not in ('public.customizations'::regclass,'public.quotes'::regclass,'public.payments'::regclass,'public.messages'::regclass,'public.files'::regclass,'public.status_history'::regclass,'public.notifications'::regclass,'public.project_reads'::regclass,'public.audit_log'::regclass)) then raise exception 'Operação bloqueada: novos relacionamentos do pedido exigem revisão antes da exclusão.'; end if;
    if exists(select 1 from public.quotes where project_id=pid) or exists(select 1 from public.payments where project_id=pid) then raise exception 'Operação bloqueada: propostas e registros financeiros devem ser preservados.'; end if;
    if exists(select 1 from public.files where project_id=pid) or exists(select 1 from storage.objects where bucket_id='project-files' and split_part(name,'/',1)=pid::text) then raise exception 'Operação bloqueada: existem arquivos ou comprovantes que devem ser preservados.'; end if;
    if exists(select 1 from public.messages where project_id=pid) then raise exception 'Operação bloqueada: existem mensagens que devem ser preservadas.'; end if;
    select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at,h.id),'[]') into timeline from public.status_history h where h.project_id=pid;
    -- Preserve audit and notifications (including their email-outbox relationships).
    update public.audit_log set project_id=null,detail=detail||jsonb_build_object('order_number',p.number,'disposed_project_id',pid) where project_id=pid;
    update public.notifications set project_id=null where project_id=pid;
    insert into public.audit_log(actor_id,action,detail) values(auth.uid(),action,jsonb_build_object('order_number',p.number,'disposed_project_id',pid,'status',p.status,'created_at',p.created_at,'deleted_at',p.deleted_at,'timeline',timeline));
    delete from public.project_reads where project_id=pid;
    delete from public.status_history where project_id=pid;
    delete from public.projects where id=pid; -- customizations has ON DELETE CASCADE
    return jsonb_build_object('id',pid,'purged',true);
  end if;
  insert into public.audit_log(actor_id,action,project_id,detail) values(auth.uid(),action,pid,jsonb_build_object('order_number',p.number,'status',p.status,'previous_archived_at',p.archived_at,'previous_deleted_at',p.deleted_at));
  return jsonb_build_object('id',pid);
end; $$;
revoke all on function private.manage_order(text,jsonb) from public,anon;
grant execute on function private.manage_order(text,jsonb) to authenticated;
create function public.manage_order(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.manage_order(action,payload);$$;
revoke all on function public.manage_order(text,jsonb) from public,anon;
grant execute on function public.manage_order(text,jsonb) to authenticated;

-- Serialize Storage inserts with project commands/purge; keep every existing check.
create or replace function private.may_upload(object_path text) returns boolean language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or split_part(object_path,'/',2)<>auth.uid()::text or array_length(string_to_array(object_path,'/'),1)<>3 then return false; end if;
  if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then return false; end if;
  if not private.can_access((split_part(object_path,'/',1))::uuid) then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(split_part(object_path,'/',1),0));
  if not exists(select 1 from public.projects p where p.id::text=split_part(object_path,'/',1) and p.status not in ('cancelled','rejected','delivered') and (p.client_id=auth.uid() or private.is_admin())) then return false; end if;
  return (select count(*) from storage.objects where bucket_id='project-files' and split_part(name,'/',1)=split_part(object_path,'/',1))<60;
exception when invalid_text_representation then return false;
end; $$;
