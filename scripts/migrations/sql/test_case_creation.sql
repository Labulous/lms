-- Start a transaction so we can rollback if anything goes wrong
begin;

-- First, create a case
with new_case as (
    insert into public.cases (
        created_by,      -- This will be the authenticated user's ID
        client_id,       -- This should be an existing client ID from your database
        doctor_id,       -- This should be an existing doctor ID from your database
        patient_name,
        patient_birth_date,
        rx_number,
        due_date,
        billing_type,
        notes
    ) values (
        '0e836a73-b1cc-45c6-a574-95b2fcfdccb7',  -- Replace with actual user ID
        '94d14fc4-8f1f-4052-bb56-bd6ad28f9195', -- Replace with actual client ID
        '', -- Replace with actual doctor ID
        'John Smith',
        '1990-01-01',
        'RX123456',
        current_timestamp + interval '7 days',
        'insurance',
        'Test case creation'
    ) returning id, qr_code
), 
-- Add a product to the case
new_product as (
    insert into public.case_products (
        case_id,
        product_id,      -- This should be an existing product ID
        quantity,
        notes,
        occlusal_details,
        contact_type
    ) 
    select 
        new_case.id,
        'e4057fc9-354a-4398-8882-cac1a078dafb', -- Replace with actual product ID
        1,
        'Test product notes',
        'Light occlusal contact',
        'light'
    from new_case
    returning id, case_id
)
-- Add teeth to the product
insert into public.case_product_teeth (
    case_product_id,
    tooth_number,
    is_range,
    shade_data
)
select 
    new_product.id,
    tooth_number,
    false,
    '{"occlusal": "A1", "middle": "A2", "gingival": "A3", "stump": null}'::jsonb
from new_product, unnest(ARRAY[11, 12, 13]) as tooth_number;

-- Verify the created case and its QR code
select 
    c.id as case_id,
    c.qr_code,
    c.status,
    cp.id as product_id,
    cpt.tooth_number
from public.cases c
join public.case_products cp on cp.case_id = c.id
join public.case_product_teeth cpt on cpt.case_product_id = cp.id
where c.patient_name = 'John Smith'
order by cpt.tooth_number;

-- If everything looks good, commit the transaction
-- commit;

-- If something went wrong, you can rollback
-- rollback;
