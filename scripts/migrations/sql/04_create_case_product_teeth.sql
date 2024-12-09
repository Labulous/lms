-- Create case_product_teeth table
create table if not exists public.case_product_teeth (
    id uuid default uuid_generate_v4() primary key,
    case_product_id uuid not null references public.case_products(id) on delete cascade,
    tooth_number integer not null,
    is_range boolean default false,
    shade_data jsonb default '{"occlusal": null, "middle": null, "gingival": null, "stump": null}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Ensure valid tooth numbers (FDI World Dental Federation notation)
    constraint valid_tooth_number check (
        (tooth_number between 11 and 18) or  -- Upper right quadrant
        (tooth_number between 21 and 28) or  -- Upper left quadrant
        (tooth_number between 31 and 38) or  -- Lower left quadrant
        (tooth_number between 41 and 48)     -- Lower right quadrant
    ),
    -- Ensure shade_data follows the expected structure
    constraint valid_shade_data check (
        (shade_data ?& array['occlusal', 'middle', 'gingival', 'stump'])
        and (shade_data is null or jsonb_typeof(shade_data) = 'object')
    )
);

-- Create partial unique index for non-range teeth
create unique index if not exists unique_non_range_teeth_idx 
    on public.case_product_teeth(case_product_id, tooth_number) 
    where not is_range;

-- Create index for faster lookups
create index if not exists case_product_teeth_case_product_id_idx 
    on public.case_product_teeth(case_product_id);

-- Create index for range queries
create index if not exists case_product_teeth_range_idx 
    on public.case_product_teeth(case_product_id, tooth_number) 
    where is_range;

-- Enable RLS
alter table public.case_product_teeth enable row level security;

-- Create RLS policies
create policy "Staff can view case product teeth"
    on public.case_product_teeth for select
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can insert case product teeth"
    on public.case_product_teeth for insert
    to authenticated
    with check (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can update case product teeth"
    on public.case_product_teeth for update
    to authenticated
    using (
        exists (
            select 1 from auth.users u
            where u.id = auth.uid()
            and u.raw_user_meta_data->>'role' in ('admin', 'technician')
        )
    );

create policy "Staff can delete case product teeth"
    on public.case_product_teeth for delete
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
    before update on public.case_product_teeth
    for each row
    execute function public.handle_updated_at();
