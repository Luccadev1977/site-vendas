-- All commercial writes use a narrow transactional RPC. No browser service key.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public;

create table private.administrator (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict
);
alter table private.administrator enable row level security;

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from private.administrator where user_id = auth.uid());
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;
create function public.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select private.is_admin(); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check(length(full_name)<=200),
  email text not null, created_at timestamptz not null default now()
);
create table public.clients (
  id uuid primary key references public.profiles(id) on delete cascade,
  company text not null default '', phone text not null default ''
);
create function private.sync_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,email) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),200),coalesce(new.email,''))
    on conflict(id) do update set email=excluded.email;
  insert into public.clients(id) values(new.id) on conflict do nothing;
  return new;
end; $$;
revoke all on function private.sync_profile() from public, anon, authenticated;
create trigger sync_profile after insert or update of email on auth.users for each row execute function private.sync_profile();
insert into public.profiles(id,full_name,email) select id,left(coalesce(raw_user_meta_data->>'full_name',''),200),coalesce(email,'') from auth.users on conflict do nothing;
insert into public.clients(id) select id from public.profiles on conflict do nothing;

create table public.categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check(length(name) between 2 and 200), description text not null default '' check(length(description)<=1000), active boolean not null default true
);
create table public.templates (
  id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id),
  slug text not null unique check(slug ~ '^[a-z0-9-]{2,100}$'), name text not null check(length(name) between 2 and 200),
  style text not null check(style in ('minimalista','moderno','premium')), description text not null default '' check(length(description)<=1000),
  accent text not null default '#6797ff' check(accent ~ '^#[0-9a-fA-F]{6}$'),
  content jsonb not null default '{}' check(jsonb_typeof(content)='object' and octet_length(content::text)<15000),
  active boolean not null default true, featured boolean not null default false
);
create table public.testimonials (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 200), company text not null default '' check(length(company)<=200),
  body text not null check(length(body) between 10 and 2000), demo boolean not null default true, active boolean not null default true
);
create table public.projects (
  id uuid primary key, number text not null unique default ('NX-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  client_id uuid not null references public.profiles(id), template_id uuid not null references public.templates(id),
  template_snapshot jsonb not null check(jsonb_typeof(template_snapshot)='object' and octet_length(template_snapshot::text)<20000),
  name text not null check(length(name) between 1 and 200),
  status text not null default 'draft' check(status in ('draft','received','analysis','needs_information','proposal_sent','awaiting_approval','awaiting_payment','payment_review','development','revision','completed','delivered','rejected','cancelled')),
  config jsonb not null check(jsonb_typeof(config)='object' and octet_length(config::text)<60000),
  brief jsonb check(jsonb_typeof(brief)='object' and octet_length(brief::text)<25000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index projects_client on public.projects(client_id,created_at desc);
create index projects_status on public.projects(status,created_at desc);
create table public.customizations (
  project_id uuid primary key references public.projects(id) on delete cascade,
  version integer not null default 1, config jsonb not null, updated_at timestamptz not null default now()
);
create table public.quotes (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
  amount bigint not null check(amount between 100 and 100000000), deadline text not null check(length(deadline) between 1 and 200),
  scope text not null check(length(scope) between 10 and 8000), terms text not null check(length(terms) between 3 and 4000),
  notes text not null default '' check(length(notes)<=4000), status text not null default 'sent' check(status in ('sent','approved','declined')),
  created_at timestamptz not null default now(), responded_at timestamptz
);
create unique index one_active_quote on public.quotes(project_id) where status in ('sent','approved');
create table public.payments (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id), quote_id uuid not null unique references public.quotes(id),
  amount bigint not null check(amount between 100 and 100000000), status text not null default 'pending' check(status in ('pending','review','confirmed')),
  confirmed_at timestamptz, confirmed_by uuid references auth.users(id), created_at timestamptz not null default now(),
  check((status='confirmed' and confirmed_at is not null and confirmed_by is not null) or (status<>'confirmed' and confirmed_at is null and confirmed_by is null))
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id), sender_id uuid not null references public.profiles(id),
  body text not null check(length(trim(body)) between 1 and 4000), created_at timestamptz not null default now()
);
create table public.files (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id), owner_id uuid not null references public.profiles(id),
  name text not null check(length(name) between 1 and 200), path text not null unique,
  mime text not null check(mime in ('image/png','image/jpeg','image/webp','application/pdf')), size integer not null check(size between 1 and 4194304),
  purpose text not null check(purpose in ('asset','attachment','receipt','message')), created_at timestamptz not null default now()
);
create table public.status_history (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
  status text not null, note text not null default '' check(length(note)<=4000), actor_id uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), project_id uuid references public.projects(id),
  title text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.project_reads (
  project_id uuid not null references public.projects(id), user_id uuid not null references public.profiles(id),
  read_at timestamptz not null default now(), primary key(project_id,user_id)
);
create table public.audit_log (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null,
  project_id uuid references public.projects(id), detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table private.settings (
  singleton boolean primary key default true check(singleton), pix jsonb not null,
  updated_at timestamptz not null default now()
);
create table private.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade, bucket timestamptz not null, count integer not null,
  primary key(user_id,bucket)
);
create table private.email_outbox (
  id uuid primary key default gen_random_uuid(), notification_id uuid not null unique references public.notifications(id),
  attempts integer not null default 0, reserved_until timestamptz, sent_at timestamptz, last_error text
);
alter table private.settings enable row level security;
alter table private.rate_limits enable row level security;
alter table private.email_outbox enable row level security;

create function private.can_access(pid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (private.is_admin() or exists(select 1 from public.projects where id=pid and client_id=auth.uid()));
$$;
revoke all on function private.can_access(uuid) from public;
grant execute on function private.can_access(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.categories enable row level security;
alter table public.templates enable row level security;
alter table public.testimonials enable row level security;
alter table public.projects enable row level security;
alter table public.customizations enable row level security;
alter table public.quotes enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.project_reads enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select private.is_admin()));
create policy clients_read on public.clients for select to authenticated using(id=(select auth.uid()) or (select private.is_admin()));
create policy categories_read on public.categories for select to anon,authenticated using(active or (select private.is_admin()));
create policy templates_read on public.templates for select to anon,authenticated using((active and exists(select 1 from public.categories where id=category_id and active)) or (select private.is_admin()));
create policy testimonials_read on public.testimonials for select to anon,authenticated using(active or (select private.is_admin()));
create policy projects_read on public.projects for select to authenticated using(client_id=(select auth.uid()) or (select private.is_admin()));
create policy customizations_read on public.customizations for select to authenticated using(private.can_access(project_id));
create policy quotes_read on public.quotes for select to authenticated using(private.can_access(project_id));
create policy payments_read on public.payments for select to authenticated using(private.can_access(project_id));
create policy messages_read on public.messages for select to authenticated using(private.can_access(project_id));
create policy files_read on public.files for select to authenticated using(private.can_access(project_id));
create policy history_read on public.status_history for select to authenticated using(private.can_access(project_id));
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy reads_read on public.project_reads for select to authenticated using(user_id=(select auth.uid()));
create policy audit_read on public.audit_log for select to authenticated using((select private.is_admin()));

revoke all on public.profiles,public.clients,public.categories,public.templates,public.testimonials,public.projects,public.customizations,public.quotes,public.payments,public.messages,public.files,public.status_history,public.notifications,public.project_reads,public.audit_log from anon,authenticated;
grant select on public.categories,public.templates,public.testimonials to anon,authenticated;
grant select on public.profiles,public.clients,public.projects,public.customizations,public.quotes,public.payments,public.messages,public.files,public.status_history,public.notifications,public.project_reads,public.audit_log to authenticated;

create index quotes_project on public.quotes(project_id,created_at desc);
create index payments_project on public.payments(project_id);
create index messages_project on public.messages(project_id,created_at);
create index files_project on public.files(project_id);
create index history_project on public.status_history(project_id,created_at);
create index notifications_user on public.notifications(user_id,created_at desc);
create index templates_category on public.templates(category_id);
create index projects_template on public.projects(template_id);
create index messages_sender on public.messages(sender_id);
create index files_owner on public.files(owner_id);
create index history_actor on public.status_history(actor_id);
create index payments_confirmer on public.payments(confirmed_by);
create index payments_confirmed on public.payments(confirmed_at) where status='confirmed';
create index notifications_project on public.notifications(project_id);
create index audit_actor on public.audit_log(actor_id);
create index audit_project on public.audit_log(project_id);

create function private.notify(uid uuid,pid uuid,title text) returns void language plpgsql security definer set search_path = '' as $$
declare nid uuid;
begin
  if uid is null then return; end if;
  insert into public.notifications(user_id,project_id,title) values(uid,pid,title) returning id into nid;
  insert into private.email_outbox(notification_id) values(nid);
end; $$;
revoke all on function private.notify(uuid,uuid,text) from public,anon,authenticated;
create function private.change_status(pid uuid,new_status text,note text default '') returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.projects set status=new_status,updated_at=now() where id=pid;
  insert into public.status_history(project_id,status,note,actor_id) values(pid,new_status,left(coalesce(note,''),4000),auth.uid());
end; $$;
revoke all on function private.change_status(uuid,text,text) from public,anon,authenticated;

create function private.valid_config(cfg jsonb,pid uuid) returns boolean language plpgsql stable security invoker set search_path = '' as $$
declare k text; v text;
begin
  if cfg is null or jsonb_typeof(cfg) is distinct from 'object' or octet_length(cfg::text)>60000 then return false; end if;
  foreach k in array array['company','slogan','primary','secondary','background','buttonColor','font','title','subtitle','description','email','phone','address','instagram','cta','logo','heroImage','notes'] loop
    if jsonb_typeof(cfg->k) is distinct from 'string' then return false; end if;
  end loop;
  if cfg->'version' is distinct from '1'::jsonb or cfg->>'font' not in ('sans','serif','mono') then return false; end if;
  if length(trim(cfg->>'company')) not between 1 and 200 or length(trim(cfg->>'title')) not between 1 and 200
    or length(cfg->>'description')>4000 or length(cfg->>'notes')>8000 or length(cfg->>'address')>500 or length(cfg->>'phone')>30 or length(cfg->>'instagram')>100 then return false; end if;
  foreach k in array array['slogan','subtitle','cta'] loop if length(cfg->>k)>200 then return false; end if; end loop;
  foreach k in array array['primary','secondary','background','buttonColor'] loop if cfg->>k !~ '^#[0-9a-fA-F]{6}$' then return false; end if; end loop;
  if cfg->>'email'<>'' and (length(cfg->>'email')>320 or cfg->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then return false; end if;
  if jsonb_typeof(cfg->'radius') is distinct from 'number' or cfg->>'radius' !~ '^[0-9]{1,2}$' or (cfg->>'radius')::int not between 0 and 32 then return false; end if;
  if jsonb_typeof(cfg->'pages') is distinct from 'number' or cfg->>'pages' !~ '^[0-9]{1,3}$' or (cfg->>'pages')::int not between 1 and 100 then return false; end if;
  foreach k in array array['services','sections','features','images'] loop
    if jsonb_typeof(cfg->k) is distinct from 'array' then return false; end if;
    if jsonb_array_length(cfg->k)>30 then return false; end if;
    if exists(select 1 from jsonb_array_elements(cfg->k) as elem where jsonb_typeof(elem) is distinct from 'string' or length(elem#>>'{}')>250) then return false; end if;
  end loop;
  if jsonb_array_length(cfg->'images')>12 or jsonb_array_length(cfg->'services')>20 or jsonb_array_length(cfg->'sections')>5 then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(cfg->'sections') as section_value where section_value not in ('sobre','servicos','galeria','depoimentos','contato')) then return false; end if;
  for v in select cfg->>'logo' union all select cfg->>'heroImage' union all select jsonb_array_elements_text(cfg->'images') loop
    if v ~ '^/api/catalog-assets/[0-9a-f-]{36}\.(jpg|png|webp)$' then continue; end if;
    if v<>'' and v !~ '^/images/[a-z-]+\.svg$' then
      if v !~ '^/api/files/[0-9a-f-]{36}\?inline=1$' then return false; end if;
      if not exists(select 1 from public.files where id=split_part(split_part(v,'/',4),'?',1)::uuid and project_id=pid and purpose='asset' and mime like 'image/%') then return false; end if;
    end if;
  end loop;
  return true;
exception when invalid_text_representation then return false;
end; $$;
revoke all on function private.valid_config(jsonb,uuid) from public,anon,authenticated;

create function private.execute_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); admin boolean := private.is_admin(); aid uuid; pid uuid; p public.projects; q public.quotes; pay public.payments;
  new_status text; cfg jsonb; v_brief jsonb; counter integer; result jsonb := '{}'::jsonb; fid uuid; path text; obj storage.objects;
begin
  if uid is null then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
  if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail.' using errcode='42501'; end if;
  if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>100000 then raise exception 'Dados inválidos.'; end if;
  insert into private.rate_limits(user_id,bucket,count) values(uid,date_trunc('minute',now()),1)
    on conflict(user_id,bucket) do update set count=private.rate_limits.count+1 returning count into counter;
  if counter>60 then raise exception 'Limite de ações atingido. Aguarde um minuto.'; end if;
  select user_id into aid from private.administrator;

  if action='read_notifications' then
    update public.notifications set read_at=now() where user_id=uid and read_at is null;
    return result;
  end if;
  if action in ('settings','category','template','testimonial') then
    if not admin then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
    if action='settings' then
      if length(payload->>'key') not between 1 and 200 or length(payload->>'beneficiary') not between 1 and 200 or length(payload->>'bank') not between 1 and 200 or length(payload->>'instructions')>4000
        or not(payload ?& array['key','beneficiary','bank','instructions']) then raise exception 'Dados Pix inválidos.'; end if;
      insert into private.settings(singleton,pix) values(true,jsonb_build_object('key',payload->>'key','beneficiary',payload->>'beneficiary','bank',payload->>'bank','instructions',payload->>'instructions'))
        on conflict(singleton) do update set pix=excluded.pix,updated_at=now();
    elsif action='category' then
      insert into public.categories(id,slug,name,description,active) values((payload->>'id')::uuid,payload->>'slug',payload->>'name',coalesce(payload->>'description',''),(payload->>'active')::boolean)
        on conflict(id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,active=excluded.active;
    elsif action='template' then
      insert into public.templates(id,category_id,slug,name,style,description,accent,content,active,featured)
        values((payload->>'id')::uuid,(payload->>'category_id')::uuid,payload->>'slug',payload->>'name',payload->>'style',payload->>'description',payload->>'accent',payload->'content',(payload->>'active')::boolean,(payload->>'featured')::boolean)
        on conflict(id) do update set category_id=excluded.category_id,slug=excluded.slug,name=excluded.name,style=excluded.style,description=excluded.description,accent=excluded.accent,content=excluded.content,active=excluded.active,featured=excluded.featured;
    else
      insert into public.testimonials(id,name,company,body,demo,active) values((payload->>'id')::uuid,payload->>'name',payload->>'company',payload->>'body',(payload->>'demo')::boolean,(payload->>'active')::boolean)
        on conflict(id) do update set name=excluded.name,company=excluded.company,body=excluded.body,demo=excluded.demo,active=excluded.active;
    end if;
    insert into public.audit_log(actor_id,action,detail) values(uid,action,jsonb_build_object('id',payload->>'id'));
    return result;
  end if;

  pid := (payload->>'id')::uuid;
  if pid is null then raise exception 'Projeto inválido.'; end if;
  -- Advisory lock also covers creation, so concurrent saves cannot overwrite another owner.
  perform pg_advisory_xact_lock(hashtextextended(pid::text,0));
  select * into p from public.projects where id=pid for update;
  if action='save_draft' then
    cfg:=payload->'config';
    if not private.valid_config(cfg,pid) then raise exception 'Dados da personalização inválidos.'; end if;
    if p.id is not null and (p.client_id<>uid or p.status<>'draft') then raise exception 'Projeto não pode ser alterado.' using errcode='42501'; end if;
    if p.id is null and not exists(select 1 from public.templates t join public.categories c on c.id=t.category_id where t.id=(payload->>'template_id')::uuid and t.active and c.active) then raise exception 'Modelo indisponível.'; end if;
    if p.id is not null and p.template_id is distinct from (payload->>'template_id')::uuid then raise exception 'Modelo do rascunho não pode ser substituído. Crie um novo projeto.'; end if;
    if p.id is null and (select count(*) from public.projects where client_id=uid and status='draft')>=20 then raise exception 'Limite de 20 rascunhos atingido.'; end if;
    insert into public.projects(id,client_id,template_id,template_snapshot,name,config) values(pid,uid,(payload->>'template_id')::uuid,(select to_jsonb(t)||jsonb_build_object('category_name',c.name) from public.templates t join public.categories c on c.id=t.category_id where t.id=(payload->>'template_id')::uuid),cfg->>'company',cfg)
      on conflict(id) do update set template_id=excluded.template_id,name=excluded.name,config=excluded.config,updated_at=now();
    insert into public.customizations(project_id,config) values(pid,cfg) on conflict(project_id) do update set config=excluded.config,version=public.customizations.version+1,updated_at=now();
    return jsonb_build_object('id',pid);
  end if;

  if p.id is null or (p.client_id<>uid and not admin) then raise exception 'Acesso ao projeto não autorizado.' using errcode='42501'; end if;
  if action='submit' then
    if p.client_id<>uid then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
    if p.status<>'draft' then return jsonb_build_object('id',p.id,'number',p.number); end if;
    if (select count(*) from public.status_history h join public.projects pr on pr.id=h.project_id where pr.client_id=uid and h.status='received' and h.created_at>now()-interval '24 hours')>=10 then raise exception 'Limite diário de pedidos atingido.'; end if;
    v_brief:=payload->'brief';
    if exists(select 1 from unnest(array['name','company','email','phone','purpose','deadline','hosting']) k where jsonb_typeof(v_brief->k) is distinct from 'string') then raise exception 'Dados do pedido inválidos.'; end if;
    if v_brief is null or jsonb_typeof(v_brief)<>'object' or octet_length(v_brief::text)>25000 or v_brief->>'consent' is distinct from 'true'
      or not(v_brief ?& array['name','company','email','phone','purpose','deadline','hosting','consent'])
      or length(trim(v_brief->>'name')) not between 3 and 200 or length(trim(v_brief->>'company')) not between 1 and 200
      or v_brief->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_brief->>'email')>320
      or v_brief->>'phone' !~ '^[+0-9 ()-]{10,25}$' or length(trim(v_brief->>'purpose')) not between 10 and 4000
      or length(v_brief->>'deadline') not between 1 and 200 or length(v_brief->>'hosting') not between 1 and 200 then raise exception 'Dados do pedido inválidos.'; end if;
    update public.projects set brief=v_brief where id=pid;
    update public.clients set company=v_brief->>'company',phone=v_brief->>'phone' where id=uid;
    perform private.change_status(pid,'received','Pedido enviado pelo cliente.');
    perform private.notify(uid,pid,'Seu pedido foi recebido.'); perform private.notify(aid,pid,'Novo pedido para análise.');
    return jsonb_build_object('id',pid,'number',p.number);
  elsif action='message' then
    if p.status='draft' then raise exception 'Projeto ainda não enviado.'; end if;
    if length(trim(coalesce(payload->>'body',''))) not between 1 and 4000 then raise exception 'Mensagem inválida.'; end if;
    insert into public.messages(project_id,sender_id,body) values(pid,uid,trim(payload->>'body'));
    perform private.notify(case when admin then p.client_id else aid end,pid,'Nova mensagem no projeto.');
  elsif action='read_messages' then
    insert into public.project_reads(project_id,user_id) values(pid,uid) on conflict(project_id,user_id) do update set read_at=now();
  elsif action='send_quote' then
    if not admin then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
    if p.status not in ('received','analysis','needs_information') then raise exception 'Proposta não pode ser enviada nesta etapa.'; end if;
    insert into public.quotes(project_id,amount,deadline,scope,terms,notes) values(pid,(payload->>'amount')::bigint,payload->>'deadline',payload->>'scope',payload->>'terms',coalesce(payload->>'notes',''));
    perform private.change_status(pid,'proposal_sent','Proposta comercial disponível para aprovação.');
    perform private.notify(p.client_id,pid,'Sua proposta está disponível.');
  elsif action in ('approve_quote','decline_quote') then
    if p.client_id<>uid or p.status not in ('proposal_sent','awaiting_approval') then raise exception 'Proposta não pode ser respondida nesta etapa.'; end if;
    select * into q from public.quotes where project_id=pid and status='sent' for update;
    if q.id is null then raise exception 'Proposta não encontrada.'; end if;
    update public.quotes set status=case when action='approve_quote' then 'approved' else 'declined' end,responded_at=now() where id=q.id;
    if action='approve_quote' then
      insert into public.payments(project_id,quote_id,amount) values(pid,q.id,q.amount);
      perform private.change_status(pid,'awaiting_payment','Proposta aprovada pelo cliente.');
      perform private.notify(aid,pid,'Cliente aprovou a proposta.'); perform private.notify(uid,pid,'Proposta aprovada. Instruções de pagamento disponíveis.');
    else
      perform private.change_status(pid,'analysis','Cliente recusou a proposta.'); perform private.notify(aid,pid,'Cliente recusou a proposta.');
    end if;
  elsif action='register_file' then
    path:=payload->>'path';
    if split_part(path,'/',1)<>pid::text or split_part(path,'/',2)<>uid::text or array_length(string_to_array(path,'/'),1)<>3 then raise exception 'Arquivo inválido.'; end if;
    select * into obj from storage.objects where bucket_id='project-files' and name=path;
    if obj.id is null or (obj.metadata->>'size')::bigint is distinct from (payload->>'size')::bigint or obj.metadata->>'mimetype' is distinct from payload->>'mime' then raise exception 'Arquivo não encontrado no armazenamento.'; end if;
    if payload->>'purpose'='asset' and (p.client_id<>uid or p.status<>'draft') then raise exception 'Arquivo de personalização não permitido nesta etapa.'; end if;
    if payload->>'purpose'='receipt' then
      if p.client_id<>uid or p.status not in ('awaiting_payment','payment_review') then raise exception 'Pagamento não está aguardando comprovante.'; end if;
      select * into pay from public.payments where project_id=pid and status in ('pending','review') for update;
      if pay.id is null then raise exception 'Pagamento não encontrado.'; end if;
    end if;
    if (select count(*) from public.files where project_id=pid)>=50 then raise exception 'Limite de 50 arquivos por projeto atingido.'; end if;
    insert into public.files(project_id,owner_id,name,path,mime,size,purpose) values(pid,uid,payload->>'name',path,payload->>'mime',(payload->>'size')::integer,payload->>'purpose') returning id into fid;
    if payload->>'purpose'='receipt' then
      update public.payments set status='review' where id=pay.id;
      perform private.change_status(pid,'payment_review','Comprovante enviado. Recebimento ainda não confirmado.'); perform private.notify(aid,pid,'Comprovante aguardando verificação manual.');
    elsif payload->>'purpose'='message' then perform private.notify(case when admin then p.client_id else aid end,pid,'Novo arquivo na conversa.'); end if;
    result:=jsonb_build_object('id',fid);
  elsif action in ('confirm_payment','payment_pending') then
    if not admin then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
    if p.status not in ('awaiting_payment','payment_review') then raise exception 'Pagamento não pode ser alterado nesta etapa.'; end if;
    select * into pay from public.payments where project_id=pid and status in ('pending','review') for update;
    if pay.id is null then raise exception 'Pagamento pendente não encontrado.'; end if;
    if action='confirm_payment' then
      update public.payments set status='confirmed',confirmed_at=now(),confirmed_by=uid where id=pay.id;
      perform private.change_status(pid,'development','Recebimento conferido e confirmado manualmente pelo administrador.'); perform private.notify(p.client_id,pid,'Pagamento confirmado. Desenvolvimento iniciado.');
    else
      update public.payments set status='pending' where id=pay.id;
      perform private.change_status(pid,'awaiting_payment','Recebimento ainda não identificado.'); perform private.notify(p.client_id,pid,'Pagamento pendente. Confira as instruções.');
    end if;
  elsif action='cancel' then
    if p.client_id<>uid or p.status not in ('draft','received','analysis','needs_information','proposal_sent','awaiting_approval') then raise exception 'Projeto não pode ser cancelado nesta etapa. Envie uma mensagem ao estúdio.'; end if;
    update public.quotes set status='declined',responded_at=now() where project_id=pid and status='sent';
    perform private.change_status(pid,'cancelled','Cancelado pelo cliente.'); perform private.notify(aid,pid,'Cliente cancelou o projeto.');
  elsif action='set_status' then
    if not admin then raise exception 'Acesso exclusivo do administrador.' using errcode='42501'; end if;
    new_status:=payload->>'status';
    if not (
      (p.status='received' and new_status in ('analysis','needs_information','rejected','cancelled')) or
      (p.status='analysis' and new_status in ('needs_information','rejected','cancelled')) or
      (p.status='needs_information' and new_status in ('analysis','rejected','cancelled')) or
      (p.status='proposal_sent' and new_status in ('awaiting_approval','cancelled')) or
      (p.status='awaiting_approval' and new_status='cancelled') or
      (p.status='development' and new_status='revision') or
      (p.status='revision' and new_status in ('development','completed')) or
      (p.status='completed' and new_status in ('revision','delivered'))
    ) then raise exception 'Transição de status não permitida.'; end if;
    if new_status in ('development','revision','completed','delivered') and not exists(select 1 from public.payments where project_id=pid and status='confirmed') then raise exception 'Pagamento ainda não confirmado.'; end if;
    if length(coalesce(payload->>'note',''))>4000 then raise exception 'Dados do histórico inválidos.'; end if;
    if new_status='cancelled' then update public.quotes set status='declined',responded_at=now() where project_id=pid and status='sent'; end if;
    perform private.change_status(pid,new_status,coalesce(payload->>'note',''));
    perform private.notify(p.client_id,pid,'O andamento do seu projeto foi atualizado: '||new_status);
  else raise exception 'Operação inválida.';
  end if;
  if admin and action not in ('message','read_messages') then insert into public.audit_log(actor_id,action,project_id,detail) values(uid,action,pid,jsonb_build_object('status',payload->>'status')); end if;
  return result;
end; $$;
revoke all on function private.execute_command(text,jsonb) from public;
grant execute on function private.execute_command(text,jsonb) to authenticated;
create function public.command(action text,payload jsonb) returns jsonb language sql security invoker set search_path = '' as $$ select private.execute_command(action,payload); $$;
revoke all on function public.command(text,jsonb) from public;
grant execute on function public.command(text,jsonb) to authenticated;

create function private.get_pix(pid uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
  if not private.is_admin() and not exists(
    select 1 from public.projects p join public.quotes q on q.project_id=p.id join public.payments pay on pay.quote_id=q.id
    where p.id=pid and p.client_id=auth.uid() and q.status='approved' and p.status in ('awaiting_payment','payment_review','development','revision','completed','delivered')
  ) then raise exception 'Acesso ao Pix indisponível antes da aprovação.' using errcode='42501'; end if;
  return (select pix from private.settings where singleton);
end; $$;
revoke all on function private.get_pix(uuid) from public;
grant execute on function private.get_pix(uuid) to authenticated;
create function public.get_pix(pid uuid default null) returns jsonb language sql stable security invoker set search_path = '' as $$ select private.get_pix(pid); $$;
revoke all on function public.get_pix(uuid) from public;
grant execute on function public.get_pix(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('project-files','project-files',false,4194304,array['image/png','image/jpeg','image/webp','application/pdf']) on conflict(id) do nothing;
create policy project_file_read on storage.objects for select to authenticated using(bucket_id='project-files' and exists(select 1 from public.projects p where p.id::text=split_part(storage.objects.name,'/',1) and (p.client_id=(select auth.uid()) or (select private.is_admin()))));
-- A private boolean lookup avoids self-referencing storage RLS when checking quota.
create function private.may_upload(object_path text) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or split_part(object_path,'/',2)<>auth.uid()::text or array_length(string_to_array(object_path,'/'),1)<>3 then return false; end if;
  if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then return false; end if;
  if not exists(select 1 from public.projects p where p.id::text=split_part(object_path,'/',1) and p.status not in ('cancelled','rejected','delivered') and (p.client_id=auth.uid() or private.is_admin())) then return false; end if;
  return (select count(*) from storage.objects where bucket_id='project-files' and split_part(name,'/',1)=split_part(object_path,'/',1))<60;
end; $$;
revoke all on function private.may_upload(text) from public;
grant execute on function private.may_upload(text) to authenticated;
create policy project_file_insert on storage.objects for insert to authenticated with check(bucket_id='project-files' and private.may_upload(name));
-- No UPDATE/upsert. Only the uploader may remove an unregistered orphan.
create policy project_file_cleanup on storage.objects for delete to authenticated using(bucket_id='project-files' and split_part(name,'/',2)=(select auth.uid())::text and not exists(select 1 from public.files f where f.path=storage.objects.name));

create function private.claim_emails() returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  with claimed as (
    select id from private.email_outbox where sent_at is null and attempts<5 and (reserved_until is null or reserved_until<now()) order by id for update skip locked limit 5
  ), updated as (
    update private.email_outbox o set attempts=attempts+1,reserved_until=now()+interval '10 minutes' from claimed c where o.id=c.id returning o.id,o.notification_id
  ) select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'email',p.email,'title',n.title,'project_id',n.project_id)),'[]') into result from updated u join public.notifications n on n.id=u.notification_id join public.profiles p on p.id=n.user_id;
  return result;
end; $$;
create function public.claim_emails() returns jsonb language sql security invoker set search_path = '' as $$ select private.claim_emails(); $$;
create function private.finish_email(eid uuid,success boolean) returns void language sql security definer set search_path = '' as $$
  update private.email_outbox set sent_at=case when success then now() else null end,last_error=case when success then null else 'SMTP delivery failed' end,reserved_until=case when success then null else now()+interval '10 minutes' end where id=eid;
$$;
create function public.finish_email(eid uuid,success boolean) returns void language sql security invoker set search_path = '' as $$ select private.finish_email(eid,success); $$;
revoke all on function private.claim_emails(),public.claim_emails(),private.finish_email(uuid,boolean),public.finish_email(uuid,boolean) from public,anon,authenticated;
grant execute on function private.claim_emails(),public.claim_emails(),private.finish_email(uuid,boolean),public.finish_email(uuid,boolean) to service_role;
