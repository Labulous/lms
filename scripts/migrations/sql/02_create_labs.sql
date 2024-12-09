-- Create labs table
create table if not exists public.labs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.labs enable row level security;

-- Allow lab admins to view their lab
create policy "Lab admins can view their lab"
  on public.labs for select
  to authenticated
  using (
    auth.user_role() = 'admin' and
    id = auth.user_lab_id()
  );

-- Allow lab admins to update their lab
create policy "Lab admins can update their lab"
  on public.labs for update
  to authenticated
  using (
    auth.user_role() = 'admin' and
    id = auth.user_lab_id()
  )
  with check (
    auth.user_role() = 'admin' and
    id = auth.user_lab_id()
  );

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.labs
  for each row execute procedure public.handle_updated_at();
