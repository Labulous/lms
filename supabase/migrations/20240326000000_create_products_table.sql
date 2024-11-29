-- Create products table
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    price decimal(10,2) not null,
    lead_time integer,
    is_client_visible boolean default true,
    is_taxable boolean default true,
    billing_type text not null check (billing_type in ('perTooth', 'perArch', 'teeth', 'generic', 'calculate')),
    category text not null check (category in ('Acrylic', 'Denture', 'E.Max', 'Full Cast', 'Implants', 'PFM', 'Zirconia', 'Misc')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger on products table
create trigger set_products_updated_at
    before update on public.products
    for each row
    execute function public.handle_updated_at();

-- Add RLS policies
alter table public.products enable row level security;

create policy "Products are viewable by authenticated users"
    on public.products for select
    to authenticated
    using (true);

create policy "Products are insertable by admin users"
    on public.products for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

create policy "Products are updatable by admin users"
    on public.products for update
    to authenticated
    using (
        exists (
            select 1
            from public.users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    )
    with check (
        exists (
            select 1
            from public.users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

create policy "Products are deletable by admin users"
    on public.products for delete
    to authenticated
    using (
        exists (
            select 1
            from public.users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );
