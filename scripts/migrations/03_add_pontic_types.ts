import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPonticEnum() {
  const { error } = await supabase.rpc('create_pontic_type_enum', {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pontic_type') THEN
          CREATE TYPE pontic_type AS ENUM (
            'N/A',
            'Wash-through',
            'Dome',
            'Modified Ridge Lap',
            'Ridge Lap',
            'Ovate',
            'Custom'
          );
        END IF;
      END
      $$;
    `
  });

  if (error) {
    console.error('Error creating pontic_type enum:', error);
    throw error;
  }
}

async function addPonticColumns() {
  const { error } = await supabase.rpc('add_pontic_columns', {
    sql: `
      ALTER TABLE case_products
      ADD COLUMN IF NOT EXISTS pontic_type pontic_type,
      ADD COLUMN IF NOT EXISTS custom_pontic text;
    `
  });

  if (error) {
    console.error('Error adding pontic columns:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Creating pontic_type enum...');
    await createPonticEnum();
    
    console.log('Adding pontic columns to case_products table...');
    await addPonticColumns();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
