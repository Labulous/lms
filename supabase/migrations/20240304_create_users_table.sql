-- Create users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade,
  email text unique,
  name text,
  role text check (role in ('admin', 'technician', 'client')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data" on users
  for select using (auth.uid() = id);

create policy "Users can update their own data" on users
  for update using (auth.uid() = id);

-- Create admin policy
create policy "Admins can view all users" on users
  for select using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Create trigger to automatically insert user data
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, name)
  values (new.id, new.email, 'client', new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Set up the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
