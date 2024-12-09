-- Create case_technicians table
create table if not exists public.case_technicians (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  lab_user_id uuid references public.lab_users(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('Lead', 'Assistant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Add constraint to ensure technician belongs to the same lab as the case
  constraint same_lab_check check (
    exists (
      select 1 
      from public.lab_users lu
      join public.cases c on c.lab_id = lu.lab_id
      where lu.id = lab_user_id 
      and c.id = case_id
      and lu.role = 'technician'
    )
  )
);
