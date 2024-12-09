import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { Database } from '../../src/types/supabase'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Starting migration...')

    // Step 1: Create necessary tables and functions
    console.log('Creating tables and functions...')
    await createTablesAndFunctions()

    // Step 2: Migrate labs data
    console.log('Migrating labs...')
    await migrateLabs()

    // Step 3: Migrate clients and doctors
    console.log('Migrating clients and doctors...')
    await migrateClientsAndDoctors()

    // Step 4: Migrate cases
    console.log('Migrating cases...')
    await migrateCases()

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

async function createTablesAndFunctions() {
  // Read and execute SQL files in order
  const sqlFiles = [
    '00_check_prerequisites.sql',
    'create_rls_helper.sql',
    '01_create_cases.sql',
    '08_setup_rls.sql'
  ]

  for (const file of sqlFiles) {
    console.log(`Executing ${file}...`)
    const { error } = await supabase.from('_migrations').insert({
      name: file,
      executed_at: new Date().toISOString()
    })
    
    if (error) {
      throw new Error(`Failed to execute ${file}: ${error.message}`)
    }
  }
}

async function migrateLabs() {
  // Add your existing labs data here
  const labs = [
    {
      id: '00000000-0000-0000-0000-000000000000', // Replace with your actual lab ID
      name: 'Your Lab Name'
    }
  ]

  const { error } = await supabase.from('labs').insert(labs)
  if (error) throw error
}

async function migrateClientsAndDoctors() {
  // Add your existing clients and doctors migration logic here
  // Make sure to associate them with the correct lab_id
}

async function migrateCases() {
  // Add your existing cases migration logic here
  // Make sure to maintain all relationships and data integrity
}

// Run the migration
runMigration()
