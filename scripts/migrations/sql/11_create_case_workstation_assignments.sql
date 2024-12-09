-- Create case_workstation_assignments table
create table if not exists public.case_workstation_assignments (
    id uuid default uuid_generate_v4() primary key,
    case_id uuid not null references public.cases(id) on delete cascade,
    workstation_id uuid not null references public.workstations(id),
    technician_id uuid not null references auth.users(id),
    status text not null check (status in ('in_progress', 'completed', 'on_hold')),
    started_at timestamp with time zone default timezone('utc'::text, now()),
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Ensure technician is actually a technician
    constraint technician_role_check check (
        exists (
            select 1 from auth.users u
            where u.id = technician_id
            and u.raw_user_meta_data->>'role' = 'technician'
        )
    )
);

-- Create indexes for faster lookups
create index if not exists case_workstation_assignments_case_id_idx 
    on public.case_workstation_assignments(case_id);
create index if not exists case_workstation_assignments_workstation_id_idx 
    on public.case_workstation_assignments(workstation_id);
create index if not exists case_workstation_assignments_technician_id_idx 
    on public.case_workstation_assignments(technician_id);

-- Enable RLS
alter table public.case_workstation_assignments enable row level security;

-- Create RLS policies
create policy "Staff can view case workstation assignments"
    on public.case_workstation_assignments for select
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Technicians can create assignments"
    on public.case_workstation_assignments for insert
    to authenticated
    with check (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' = 'technician'
        )
    );

create policy "Technicians can update their own assignments"
    on public.case_workstation_assignments for update
    to authenticated
    using (
        technician_id = auth.uid() or
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Function to update case status based on workstation assignments
create or replace function public.update_case_status()
returns trigger as $$
declare
    all_completed boolean;
begin
    -- Check if all workstation assignments for this case are completed
    select bool_and(status = 'completed') into all_completed
    from public.case_workstation_assignments
    where case_id = NEW.case_id;

    -- Update case status
    update public.cases
    set 
        status = case
            when all_completed then 'completed'
            when NEW.status = 'in_progress' then 'in_progress'
            else status
        end,
        updated_at = now()
    where id = NEW.case_id;

    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger to update case status
create trigger update_case_status_on_assignment
    after insert or update on public.case_workstation_assignments
    for each row
    execute function public.update_case_status();
