-- Create case_scans table to track QR code scans
create table if not exists public.case_scans (
    id uuid default uuid_generate_v4() primary key,
    case_id uuid not null references public.cases(id) on delete cascade,
    scanned_by uuid not null references auth.users(id),
    scanned_at timestamp with time zone default timezone('utc'::text, now()) not null,
    previous_status text not null,
    new_status text not null,
    scan_location text,  -- Optional: to track where the scan happened
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index if not exists case_scans_case_id_idx on public.case_scans(case_id);
create index if not exists case_scans_scanned_by_idx on public.case_scans(scanned_by);

-- Enable RLS
alter table public.case_scans enable row level security;

-- Create RLS policies
create policy "Staff can view case scans"
    on public.case_scans for select
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can insert case scans"
    on public.case_scans for insert
    to authenticated
    with check (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

-- Create function to update case status on scan
create or replace function public.handle_case_scan()
returns trigger as $$
begin
    -- Update the case's last scan info
    update public.cases
    set 
        last_scanned_by = NEW.scanned_by,
        last_scanned_at = NEW.scanned_at,
        status = NEW.new_status,
        updated_at = now()
    where id = NEW.case_id;
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger to update case status when scanned
create trigger update_case_on_scan
    after insert on public.case_scans
    for each row
    execute function public.handle_case_scan();
