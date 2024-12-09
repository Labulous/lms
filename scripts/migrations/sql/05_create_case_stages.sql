-- Create case_stages table
create table if not exists public.case_stages (
    id uuid default uuid_generate_v4() primary key,
    case_id uuid not null references public.cases(id) on delete cascade,
    stage_name text not null,
    status text not null check (status in ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    start_date timestamp with time zone,
    completion_date timestamp with time zone,
    assigned_to uuid references public.lab_users(id),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Add constraint to ensure assigned user belongs to the same lab as the case
    constraint same_lab_check check (
        exists (
            select 1 from public.cases c
            join public.lab_users lu on lu.lab_id = c.lab_id
            where c.id = case_id
            and lu.id = assigned_to
            and lu.role = 'technician'
        )
    )
);
