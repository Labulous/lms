import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

const TABLES = [
  'cases',
  'case_files',
  'case_products',
  'case_product_teeth',
  'case_stages',
  'case_technicians'
];

async function verifyTableExists(table: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', table)
    .single();

  if (error) {
    console.error(`Error checking table ${table}:`, error.message);
    return false;
  }

  return !!data;
}

async function checkRLSEnabled() {
  console.log('Checking RLS status for tables...\n');
  let allTablesExist = true;
  
  for (const table of TABLES) {
    try {
      const tableExists = await verifyTableExists(table);
      if (!tableExists) {
        console.log(`Table: ${table}`);
        console.log('-------------------');
        console.log('❌ Table does not exist in public schema');
        console.log();
        allTablesExist = false;
        continue;
      }

      // Try to select without RLS bypass (using anon key)
      const anonClient = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      const { data: publicData, error: publicError } = await anonClient
        .from(table)
        .select('*')
        .limit(1);

      // Try to select with RLS bypass (using service role)
      const { data: adminData, error: adminError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      console.log(`Table: ${table}`);
      console.log('-------------------');
      
      if (publicError?.message?.includes('permission denied')) {
        console.log('✅ RLS is enabled and blocking unauthorized access');
      } else if (!publicError && !publicData?.length) {
        console.log('✅ RLS is enabled (no data visible to public)');
      } else {
        console.log('❌ RLS might not be properly configured');
      }

      if (adminError) {
        console.log('❌ Service role cannot access table:', adminError.message);
      } else {
        console.log('✅ Service role has proper access');
      }
      
      console.log();
    } catch (error: any) {
      console.error(`Error checking ${table}:`, error.message);
    }
  }

  if (!allTablesExist) {
    console.log('\nSome tables are missing. Please run the following SQL migrations in order:');
    console.log('1. Run 00_check_prerequisites.sql');
    console.log('2. Run 01_create_cases.sql');
    console.log('3. Run 02_create_case_files.sql');
    console.log('4. Run 03_create_case_products.sql');
    console.log('5. Run 04_create_case_product_teeth.sql');
    console.log('6. Run 05_create_case_stages.sql');
    console.log('7. Run 06_create_case_technicians.sql');
    console.log('8. Run create_rls_helper.sql');
    console.log('9. Run 08_setup_rls.sql');
    console.log('\nOr simply run 00_run_migrations.sql to execute all migrations in order.');
    return;
  }

  console.log('\nRecommendations:');
  console.log('----------------');
  console.log('1. If any tables show "RLS might not be properly configured", run 08_setup_rls.sql');
  console.log('2. Ensure all tables have proper RLS policies for:');
  console.log('   - SELECT (view records)');
  console.log('   - INSERT (create records)');
  console.log('   - UPDATE (modify records)');
  console.log('   - DELETE (remove records)');
  console.log('\n3. Verify that policies properly check lab_id in the JWT');
}

// Run verification
checkRLSEnabled()
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
