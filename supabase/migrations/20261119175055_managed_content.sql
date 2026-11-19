create table public.portfolio (
  id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 2 and 200),
  description text not null check(length(description) between 10 and 2000),
  image text not null check(image ~ '^(/images/[a-z-]+\.svg|/api/catalog-assets/[0-9a-f-]{36}\.(jpg|png|webp))$'),
  url text not null default '' check(url='' or (url ~ '^https://[^[:space:]]+$' and length(url)<=1000)),
  active boolean not null default false, authorized boolean not null check(authorized), created_at timestamptz not null default now()
);
alter table public.portfolio enable row level security;
revoke all on public.portfolio from anon,authenticated;
grant select on public.portfolio to anon,authenticated;
create policy portfolio_read on public.portfolio for select to anon,authenticated using((active and authorized) or (select private.is_admin()));
create function private.save_portfolio(payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
  if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail.'; end if;
  if octet_length(payload::text)>10000 or payload->'authorized' is distinct from 'true'::jsonb then raise exception 'Dados inválidos. Confirme a autorização de divulgação.'; end if;
  pid:=(payload->>'id')::uuid;
  insert into public.portfolio(id,title,description,image,url,active,authorized) values(pid,payload->>'title',payload->>'description',payload->>'image',coalesce(payload->>'url',''),(payload->>'active')::boolean,true)
  on conflict(id) do update set title=excluded.title,description=excluded.description,image=excluded.image,url=excluded.url,active=excluded.active,authorized=excluded.authorized;
  insert into public.audit_log(actor_id,action,detail) values(auth.uid(),'portfolio',jsonb_build_object('id',pid));
  return jsonb_build_object('id',pid);
end; $$;
revoke all on function private.save_portfolio(jsonb) from public;
grant execute on function private.save_portfolio(jsonb) to authenticated;
create function public.save_portfolio(payload jsonb) returns jsonb language sql security invoker set search_path = '' as $$ select private.save_portfolio(payload); $$;
revoke all on function public.save_portfolio(jsonb) from public;
grant execute on function public.save_portfolio(jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('catalog-assets','catalog-assets',false,4194304,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy catalog_images_read on storage.objects for select to anon,authenticated using(bucket_id='catalog-assets');
create policy catalog_images_insert on storage.objects for insert to authenticated with check(bucket_id='catalog-assets' and (select private.is_admin()));
