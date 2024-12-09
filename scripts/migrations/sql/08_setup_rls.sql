-- Enable RLS on all tables
alter table public.labs enable row level security;
alter table public.cases enable row level security;
alter table public.case_files enable row level security;
alter table public.case_products enable row level security;
alter table public.case_product_teeth enable row level security;
alter table public.case_stages enable row level security;
alter table public.case_technicians enable row level security;
alter table public.clients enable row level security;
alter table public.doctors enable row level security;
alter table public.products enable row level security;
alter table auth.users enable row level security;

-- Create policies for labs
create policy "Users can view their lab"
  on public.labs for select
  using (id = (select lab_id from auth.users where id = auth.uid()));

create policy "Super admins can manage labs"
  on public.labs for all
  using (
    exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
      and raw_user_meta_data->>'is_super_admin' = 'true'
    )
  );

-- Cases policies
create policy "Lab staff can view all cases in their lab"
  on public.cases for select
  to authenticated
  using (
    auth.is_lab_staff() 
    and lab_id = auth.user_lab_id()
  );

create policy "Clinic staff can view their clinic's cases"
  on public.cases for select
  to authenticated
  using (
    auth.is_clinic_staff()
    and client_id = auth.user_client_id()
  );

create policy "Lab staff can create cases"
  on public.cases for insert
  to authenticated
  with check (
    auth.can_create_case(lab_id, client_id)
  );

create policy "Lab staff can update cases in their lab"
  on public.cases for update
  to authenticated
  using (
    auth.is_lab_staff()
    and lab_id = auth.user_lab_id()
  );

-- Create policies for case files
create policy "Users can view files in their lab"
  on public.case_files for select
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
    )
  );

create policy "Lab admins and technicians can manage files"
  on public.case_files for all
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
      and u.raw_user_meta_data->>'role' in ('admin', 'technician')
    )
  );

-- Create policies for case products
create policy "Users can view products in their lab"
  on public.case_products for select
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
    )
  );

create policy "Lab admins and technicians can manage products"
  on public.case_products for all
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
      and u.raw_user_meta_data->>'role' in ('admin', 'technician')
    )
  );

-- Create policies for case product teeth
create policy "Users can view teeth in their lab"
  on public.case_product_teeth for select
  using (
    exists (
      select 1 from public.case_products cp
      join public.cases c on c.id = cp.case_id
      join auth.users u on u.lab_id = c.lab_id
      where cp.id = case_product_id
      and u.id = auth.uid()
    )
  );

create policy "Lab admins and technicians can manage teeth"
  on public.case_product_teeth for all
  using (
    exists (
      select 1 from public.case_products cp
      join public.cases c on c.id = cp.case_id
      join auth.users u on u.lab_id = c.lab_id
      where cp.id = case_product_id
      and u.id = auth.uid()
      and u.raw_user_meta_data->>'role' in ('admin', 'technician')
    )
  );

-- Create policies for case stages
create policy "Users can view stages in their lab"
  on public.case_stages for select
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
    )
  );

create policy "Lab admins and technicians can manage stages"
  on public.case_stages for all
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
      and u.raw_user_meta_data->>'role' in ('admin', 'technician')
    )
  );

-- Create policies for case technicians
create policy "Users can view technicians in their lab"
  on public.case_technicians for select
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
    )
  );

create policy "Lab admins and technicians can manage technicians"
  on public.case_technicians for all
  using (
    exists (
      select 1 from public.cases c
      join auth.users u on u.lab_id = c.lab_id
      where c.id = case_id
      and u.id = auth.uid()
      and u.raw_user_meta_data->>'role' in ('admin', 'technician')
    )
  );

-- Clients policies
create policy "Lab staff can view all clients in their lab"
  on public.clients for select
  to authenticated
  using (
    auth.is_lab_staff()
    and lab_id = auth.user_lab_id()
  );

create policy "Clinic staff can view their own clinic"
  on public.clients for select
  to authenticated
  using (
    auth.is_clinic_staff()
    and id = auth.user_client_id()
  );

-- Doctors policies
create policy "Lab staff can view all doctors in their lab"
  on public.doctors for select
  to authenticated
  using (
    auth.is_lab_staff()
    and exists (
      select 1 from public.clients c
      where c.id = client_id
      and c.lab_id = auth.user_lab_id()
    )
  );

create policy "Clinic staff can view their clinic's doctors"
  on public.doctors for select
  to authenticated
  using (
    auth.is_clinic_staff()
    and client_id = auth.user_client_id()
  );

-- Products policies
create policy "Lab staff can view all products in their lab"
  on public.products for select
  to authenticated
  using (
    auth.is_lab_staff()
    and lab_id = auth.user_lab_id()
  );

create policy "Clinic staff can view products from their lab"
  on public.products for select
  to authenticated
  using (
    auth.is_clinic_staff()
    and exists (
      select 1 from public.clients c
      where c.id = auth.user_client_id()
      and c.lab_id = lab_id
    )
  );

-- User management policies
create policy "Lab admins can manage all users in their lab"
  on auth.users for all
  to authenticated
  using (
    auth.is_lab_admin()
    and lab_id = auth.user_lab_id()
  );

create policy "Clinic admins can view and manage their clinic's users"
  on auth.users for all
  to authenticated
  using (
    auth.is_clinic_admin()
    and auth.user_client_id() = (raw_user_meta_data->>'client_id')::uuid
  );
