-- Check if required tables exist and create labs structure
do $$
declare
  missing_tables text[];
begin
  missing_tables := array[]::text[];
  
  -- Create labs table if it doesn't exist (top of hierarchy)
  create table if not exists public.labs (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Add lab_id to auth.users if it doesn't exist
  do $$
  begin
    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'auth' 
      and table_name = 'users' 
      and column_name = 'lab_id'
    ) then
      alter table auth.users 
      add column lab_id uuid references public.labs(id);
    end if;
  end $$;

  -- Create trigger to ensure user roles are valid for their lab
  create or replace function public.check_user_role()
  returns trigger as $$
  begin
    -- Lab staff roles
    if NEW.raw_user_meta_data->>'role' in ('admin', 'technician') then
      if NEW.lab_id is null then
        raise exception 'Lab staff must be assigned to a lab';
      end if;
    -- Dental clinic roles
    elsif NEW.raw_user_meta_data->>'role' in ('clinic_admin', 'clinic_staff') then
      -- Dental staff must be associated with a client (dental clinic)
      if not exists (
        select 1 from public.clients c
        where c.id = (NEW.raw_user_meta_data->>'client_id')::uuid
        and c.lab_id = NEW.lab_id
      ) then
        raise exception 'Dental staff must be associated with a valid dental clinic';
      end if;

      -- Only lab admins can create clinic_admin accounts
      if NEW.raw_user_meta_data->>'role' = 'clinic_admin' 
         and not exists (
           select 1 from auth.users u
           where u.id = auth.uid()
           and u.raw_user_meta_data->>'role' = 'admin'
           and u.lab_id = NEW.lab_id
         ) then
        raise exception 'Only lab administrators can create clinic admin accounts';
      end if;

      -- Only lab admins or clinic admins can create clinic_staff accounts
      if NEW.raw_user_meta_data->>'role' = 'clinic_staff' 
         and not exists (
           select 1 from auth.users u
           where u.id = auth.uid()
           and (
             (u.raw_user_meta_data->>'role' = 'admin' and u.lab_id = NEW.lab_id)
             or (
               u.raw_user_meta_data->>'role' = 'clinic_admin'
               and u.raw_user_meta_data->>'client_id' = NEW.raw_user_meta_data->>'client_id'
             )
           )
         ) then
        raise exception 'Only lab administrators or clinic administrators can create clinic staff accounts';
      end if;
    else
      raise exception 'Invalid role. Must be admin, technician, clinic_admin, or clinic_staff';
    end if;
    
    return NEW;
  end;
  $$ language plpgsql;

  -- Create the trigger if it doesn't exist
  drop trigger if exists check_user_role_trigger on auth.users;
  create trigger check_user_role_trigger
    before insert or update on auth.users
    for each row
    execute function public.check_user_role();

  -- Ensure clients table has lab_id
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'clients' 
    and column_name = 'lab_id'
  ) then
    alter table public.clients 
    add column lab_id uuid references public.labs(id);
  end if;

  -- Check for other required tables
  if not exists (select 1 from information_schema.tables where table_name = 'clients') then
    missing_tables := array_append(missing_tables, 'clients');
  end if;
  
  if not exists (select 1 from information_schema.tables where table_name = 'doctors') then
    missing_tables := array_append(missing_tables, 'doctors');
  end if;
  
  if not exists (select 1 from information_schema.tables where table_name = 'products') then
    missing_tables := array_append(missing_tables, 'products');
  end if;

  -- Check for users in labs
  if not exists (
    select 1 from auth.users
    where lab_id is not null
    and raw_user_meta_data->>'role' in ('admin', 'technician', 'clinic_admin', 'clinic_staff')
    limit 1
  ) then
    raise notice 'Warning: No users with lab assignments found';
  end if;
  
  if array_length(missing_tables, 1) > 0 then
    raise exception 'Missing required tables: %', array_to_string(missing_tables, ', ');
  else
    raise notice 'All prerequisite tables exist or have been created';
  end if;
end;
$$;
