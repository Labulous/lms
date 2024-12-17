-- Run all migrations in order
\i 00_check_prerequisites.sql
\i 01_create_cases.sql
\i 02_create_case_files.sql
\i 03_create_case_products.sql
\i 04_create_case_product_teeth.sql
\i 05_create_case_stages.sql
\i 06_create_case_technicians.sql
\i create_rls_helper.sql
\i 08_setup_rls.sql
\i 13_create_reference_tables.sql

-- Verify tables were created
do $$
begin
  assert exists(select from pg_tables where schemaname = 'public' and tablename = 'cases'), 
    'cases table not found';
  assert exists(select from pg_tables where schemaname = 'public' and tablename = 'case_files'),
    'case_files table not found';
  assert exists(select from pg_tables where schemaname = 'public' and tablename = 'case_products'),
    'case_products table not found';
  assert exists(select from pg_tables where schemaname = 'public' and tablename = 'case_product_teeth'),
    'case_product_teeth table not found';
  assert exists(select from pg_tables where schemaname = 'public' and tablename = 'case_stages'),
    'case_stages table not found';
  assert exists(select from pg_tables where schemaname = 'public' and tablename = 'case_technicians'),
    'case_technicians table not found';
  
  raise notice 'All tables created successfully';
end;
$$;
