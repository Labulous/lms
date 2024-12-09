import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return !error;
  } catch {
    return false;
  }
}

async function verifyMigration() {
  console.log('Verifying database tables...\n');

  // Check prerequisite tables
  const prerequisites = ['clients', 'doctors', 'labs', 'products', 'technicians'];
  const missingPrereqs = [];
  
  for (const table of prerequisites) {
    const exists = await checkTableExists(table);
    console.log(`${exists ? '✅' : '❌'} ${table} table`);
    if (!exists) {
      missingPrereqs.push(table);
    }
  }

  if (missingPrereqs.length > 0) {
    console.error(`\n❌ Missing prerequisite tables: ${missingPrereqs.join(', ')}`);
    console.log('\nPlease create these tables first before proceeding with the case management tables migration.');
    process.exit(1);
  }

  console.log('\nChecking case management tables...');
  
  // Check case management tables
  const caseTables = [
    'cases',
    'case_files',
    'case_products',
    'case_product_teeth',
    'case_stages',
    'case_technicians'
  ];

  const results = await Promise.all(
    caseTables.map(async (table) => {
      const exists = await checkTableExists(table);
      console.log(`${exists ? '✅' : '❌'} ${table} table`);
      return { table, exists };
    })
  );

  const missingTables = results.filter(r => !r.exists).map(r => r.table);

  if (missingTables.length > 0) {
    console.log('\n❌ Some tables are missing. Please run the migrations in order:');
    console.log('1. 01_create_cases.sql');
    console.log('2. 02_create_case_files.sql');
    console.log('3. 03_create_case_products.sql');
    console.log('4. 04_create_case_product_teeth.sql');
    console.log('5. 05_create_case_stages.sql');
    console.log('6. 06_create_case_technicians.sql');
    console.log('7. 07_create_indexes.sql');
    console.log('8. 08_setup_rls.sql');
  } else {
    console.log('\n✅ All case management tables exist!');
  }
}

// Run verification
verifyMigration()
  .catch(error => {
    console.error('Error during verification:', error);
    process.exit(1);
  });
