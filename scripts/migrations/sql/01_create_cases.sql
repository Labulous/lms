-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create cases table
create table if not exists public.cases (
    id uuid default uuid_generate_v4() primary key,
    created_by uuid references auth.users(id),
    client_id uuid references public.clients(id),
    doctor_id uuid references public.doctors(id),
    patient_name text,
    patient_birth_date date,
    pan_number text,
    rx_number text,
    qr_code text unique not null,
    due_date timestamp with time zone,
    received_date timestamp with time zone default timezone('utc'::text, now()),
    ship_date timestamp with time zone,
    status text not null check (status in ('in_queue', 'in_progress')) default 'in_queue',
    billing_type text not null check (billing_type in ('insurance', 'cash', 'warranty')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger to validate doctor belongs to client
create or replace function public.validate_case_doctor()
returns trigger as $$
begin
    if NEW.doctor_id is not null and NEW.client_id is not null then
        if not exists (
            select 1 from public.doctors d
            where d.id = NEW.doctor_id
            and d.client_id = NEW.client_id
        ) then
            raise exception 'Doctor must belong to the specified client';
        end if;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger validate_case_doctor_trigger
    before insert or update on public.cases
    for each row
    execute function public.validate_case_doctor();

-- Create RLS policies for cases
alter table public.cases enable row level security;

-- Allow admins and technicians to view all cases
create policy "Staff can view all cases"
    on public.cases for select
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

-- Allow admins and technicians to insert cases
create policy "Staff can insert cases"
    on public.cases for insert
    to authenticated
    with check (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

-- Allow admins and technicians to update cases
create policy "Staff can update cases"
    on public.cases for update
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

-- Create trigger to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.cases
    for each row
    execute function public.handle_updated_at();
