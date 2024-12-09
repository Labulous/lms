-- Create workstations table
create table if not exists public.workstations (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    order_sequence integer,  -- Optional: to define a default sequence of workstations
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(name)
);

-- Enable RLS
alter table public.workstations enable row level security;

-- Create RLS policies
create policy "Everyone can view workstations"
    on public.workstations for select
    to authenticated
    using (true);

create policy "Admin can manage workstations"
    on public.workstations for all
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' = 'admin'
        )
    );
