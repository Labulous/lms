-- Add requires_shade column to products table
alter table public.products 
add column if not exists requires_shade boolean default false;

-- Update existing products to set requires_shade for specific categories
update public.products
set requires_shade = true
where category in ('Zirconia', 'PFM', 'E.Max');
