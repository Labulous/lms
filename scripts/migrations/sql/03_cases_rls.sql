-- Enable RLS on cases table
alter table public.cases enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Authenticated users can access all cases" on cases;
drop policy if exists "Users can view cases they have access to" on cases;
drop policy if exists "Users can insert cases they have access to" on cases;
drop policy if exists "Users can update cases they have access to" on cases;
drop policy if exists "Users can delete cases they have access to" on cases;

-- Create policies for different operations
create policy "Users can view cases they have access to" 
on cases for select using (
  auth.role() = 'authenticated' and (
    -- Admin can see all cases
    exists (
      select 1 from users 
      where id = auth.uid() 
      and role = 'admin'
    ) or
    -- Users can see cases where they are the creator
    (auth.uid() = created_by) or
    -- Users can see cases for their client_id
    exists (
      select 1 from users 
      where id = auth.uid() 
      and client_id = cases.client_id
    )
  )
);

create policy "Users can insert cases they have access to"
on cases for insert with check (
  auth.role() = 'authenticated' and (
    -- Admin can insert any case
    exists (
      select 1 from users 
      where id = auth.uid() 
      and role = 'admin'
    ) or
    -- Users can only insert cases for their client
    exists (
      select 1 from users 
      where id = auth.uid() 
      and client_id = cases.client_id
    )
  )
);

create policy "Users can update cases they have access to"
on cases for update using (
  auth.role() = 'authenticated' and (
    -- Admin can update any case
    exists (
      select 1 from users 
      where id = auth.uid() 
      and role = 'admin'
    ) or
    -- Users can update cases where they are the creator
    (auth.uid() = created_by) or
    -- Users can update cases for their client
    exists (
      select 1 from users 
      where id = auth.uid() 
      and client_id = cases.client_id
    )
  )
);

create policy "Users can delete cases they have access to"
on cases for delete using (
  auth.role() = 'authenticated' and (
    -- Only admins can delete cases
    exists (
      select 1 from users 
      where id = auth.uid() 
      and role = 'admin'
    )
  )
);

-- Grant necessary permissions
grant all on cases to authenticated;
