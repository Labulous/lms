import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

async function createCasesTables() {
  try {
    // Check cases table
    console.log('Checking cases table...');
    const casesExists = await checkTableExists('cases');
    console.log(casesExists ? 'Cases table exists' : 'Cases table does not exist');

    // Check case_files table
    console.log('Checking case_files table...');
    const filesExists = await checkTableExists('case_files');
    console.log(filesExists ? 'Case files table exists' : 'Case files table does not exist');

    // Check case_products table
    console.log('Checking case_products table...');
    const productsExists = await checkTableExists('case_products');
    console.log(productsExists ? 'Case products table exists' : 'Case products table does not exist');

    // Check case_product_teeth table
    console.log('Checking case_product_teeth table...');
    const teethExists = await checkTableExists('case_product_teeth');
    console.log(teethExists ? 'Case product teeth table exists' : 'Case product teeth table does not exist');

    // Check case_stages table
    console.log('Checking case_stages table...');
    const stagesExists = await checkTableExists('case_stages');
    console.log(stagesExists ? 'Case stages table exists' : 'Case stages table does not exist');

    // Check case_technicians table
    console.log('Checking case_technicians table...');
    const techniciansExists = await checkTableExists('case_technicians');
    console.log(techniciansExists ? 'Case technicians table exists' : 'Case technicians table does not exist');

    // Set up storage bucket
    console.log('Setting up storage bucket...');
    try {
      const { error: storageError } = await supabase.storage.createBucket('case-files', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'application/pdf']
      });

      if (storageError) {
        if (storageError.message.includes('already exists')) {
          console.log('Storage bucket already exists');
        } else {
          throw storageError;
        }
      } else {
        console.log('Storage bucket created successfully');
      }
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('Storage bucket already exists');
      } else {
        throw error;
      }
    }

    // Summary
    console.log('\nDatabase Status:');
    console.log('---------------');
    console.log(`Cases Table: ${casesExists ? '✅' : '❌'}`);
    console.log(`Case Files Table: ${filesExists ? '✅' : '❌'}`);
    console.log(`Case Products Table: ${productsExists ? '✅' : '❌'}`);
    console.log(`Case Product Teeth Table: ${teethExists ? '✅' : '❌'}`);
    console.log(`Case Stages Table: ${stagesExists ? '✅' : '❌'}`);
    console.log(`Case Technicians Table: ${techniciansExists ? '✅' : '❌'}`);

    if (!casesExists || !filesExists || !productsExists || !teethExists || !stagesExists || !techniciansExists) {
      console.log('\n⚠️  Some tables are missing. Please create them in the Supabase dashboard using the SQL editor.');
      process.exit(1);
    }

    console.log('\n✅ All tables exist and are properly configured');
  } catch (error) {
    console.error('Error checking tables:', error);
    throw error;
  }
}

// Run migration
createCasesTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
