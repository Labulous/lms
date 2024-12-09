-- Function to get RLS policies for specified tables
create or replace function get_policies(tables text[])
returns table (
  table_name text,
  policyname name,
  operation text,
  permissive text,
  roles name[],
  qual text,
  with_check text
)
language sql
security definer
as $$
  select
    schemaname || '.' || tablename as table_name,
    policyname,
    operation,
    permissive,
    roles,
    qual,
    with_check
  from pg_policies
  where schemaname || '.' || tablename = any(tables)
  order by tablename, policyname;
$$;

-- Helper functions for RLS policies
create or replace function auth.user_lab_id() returns uuid as $$
  select lab_id from auth.users where id = auth.uid();
$$ language sql security definer;

create or replace function auth.user_role() returns text as $$
  select raw_user_meta_data->>'role' from auth.users where id = auth.uid();
$$ language sql security definer;

create or replace function auth.user_client_id() returns uuid as $$
  select (raw_user_meta_data->>'client_id')::uuid from auth.users where id = auth.uid();
$$ language sql security definer;

create or replace function auth.is_lab_admin() returns boolean as $$
  select auth.user_role() = 'admin';
$$ language sql security definer;

create or replace function auth.is_lab_staff() returns boolean as $$
  select auth.user_role() in ('admin', 'technician');
$$ language sql security definer;

create or replace function auth.is_clinic_admin() returns boolean as $$
  select auth.user_role() = 'clinic_admin';
$$ language sql security definer;

create or replace function auth.is_clinic_staff() returns boolean as $$
  select auth.user_role() in ('clinic_admin', 'clinic_staff');
$$ language sql security definer;

-- Function to check if user has access to a specific case
create or replace function auth.can_access_case(case_id uuid) returns boolean as $$
declare
  v_case_lab_id uuid;
  v_case_client_id uuid;
begin
  select lab_id, client_id into v_case_lab_id, v_case_client_id
  from public.cases
  where id = case_id;

  -- Lab staff can access all cases in their lab
  if auth.is_lab_staff() then
    return v_case_lab_id = auth.user_lab_id();
  end if;

  -- Clinic staff can only access cases from their clinic
  if auth.is_clinic_staff() then
    return v_case_client_id = auth.user_client_id();
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- Function to check if user can create a case
create or replace function auth.can_create_case(p_lab_id uuid, p_client_id uuid) returns boolean as $$
begin
  -- Lab staff can create cases for any client in their lab
  if auth.is_lab_staff() then
    return p_lab_id = auth.user_lab_id();
  end if;

  -- Clinic staff can only create cases for their clinic
  if auth.is_clinic_staff() then
    return p_client_id = auth.user_client_id()
           and exists (
             select 1 from public.clients c
             where c.id = p_client_id
             and c.lab_id = p_lab_id
           );
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- Function to check if user can manage clinic users
create or replace function auth.can_manage_clinic_users(p_client_id uuid) returns boolean as $$
begin
  -- Lab admins can manage any clinic's users in their lab
  if auth.is_lab_admin() then
    return exists (
      select 1 from public.clients c
      where c.id = p_client_id
      and c.lab_id = auth.user_lab_id()
    );
  end if;

  -- Clinic admins can only manage users in their own clinic
  if auth.is_clinic_admin() then
    return p_client_id = auth.user_client_id();
  end if;

  return false;
end;
$$ language plpgsql security definer;
