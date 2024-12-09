-- Create indexes
create index if not exists idx_cases_case_id on cases(case_id);
create index if not exists idx_cases_client_id on cases(client_id);
create index if not exists idx_cases_doctor_id on cases(doctor_id);
create index if not exists idx_cases_lab_id on cases(lab_id);
create index if not exists idx_case_products_case_id on case_products(case_id);
create index if not exists idx_case_product_teeth_case_product_id on case_product_teeth(case_product_id);
create index if not exists idx_case_files_case_id on case_files(case_id);
