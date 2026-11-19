-- Execute ONLY in Supabase SQL Editor as the project owner, after creating
-- and confirming your account through the application. Replace the UUID below.
-- The singleton primary key deliberately allows exactly one administrator.
begin;
do $$
declare owner_uuid uuid := '00000000-0000-0000-0000-000000000000';
begin
  if owner_uuid='00000000-0000-0000-0000-000000000000' then raise exception 'Substitua owner_uuid pelo UUID da sua conta confirmada.'; end if;
  if not exists(select 1 from auth.users where id=owner_uuid and email_confirmed_at is not null) then raise exception 'A conta precisa existir e ter e-mail confirmado.'; end if;
  insert into private.administrator(singleton,user_id) values(true,owner_uuid);
end; $$;
commit;
