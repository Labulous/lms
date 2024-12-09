-- First, let's see the structure of our tables
select 
    table_name, 
    column_name, 
    data_type 
from information_schema.columns 
where table_schema = 'public' 
and table_name in ('clients', 'doctors', 'products')
order by table_name, ordinal_position;

-- Get a user ID (admin or technician)
select id, email, raw_user_meta_data->>'role' as role
from auth.users
where raw_user_meta_data->>'role' in ('admin', 'technician')
limit 1;

-- Get a client ID (show all columns)
select *
from public.clients
limit 1;

-- Get a doctor ID (show all columns)
select *
from public.doctors
limit 1;

-- Get a product ID (show all columns)
select *
from public.products
limit 1;
