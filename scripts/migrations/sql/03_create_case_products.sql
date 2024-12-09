-- Create case_products table
create table if not exists public.case_products (
    id uuid default uuid_generate_v4() primary key,
    case_id uuid not null references public.cases(id) on delete cascade,
    product_id uuid not null references public.products(id),
    quantity integer not null default 1,
    unit_price decimal(10,2),
    notes text,
    occlusal_details text,
    contact_type text,
    pontic_details text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Ensure quantity is positive
    constraint positive_quantity check (quantity > 0),
    -- Validate contact_type
    constraint valid_contact_type check (
        contact_type is null or 
        contact_type in ('na', 'light', 'medium', 'heavy')
    )
);

-- Create index for faster lookups
create index if not exists case_products_case_id_idx on public.case_products(case_id);
create index if not exists case_products_product_id_idx on public.case_products(product_id);

-- Enable RLS
alter table public.case_products enable row level security;

-- Create RLS policies
create policy "Staff can view case products"
    on public.case_products for select
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can insert case products"
    on public.case_products for insert
    to authenticated
    with check (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can update case products"
    on public.case_products for update
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can delete case products"
    on public.case_products for delete
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

-- Create trigger for updating updated_at
create trigger set_updated_at
    before update on public.case_products
    for each row
    execute function public.handle_updated_at();
