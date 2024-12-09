import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SQL_DIR = join(__dirname, 'sql');

console.log(chalk.blue('\nLabulous SQL Migration Instructions'));
console.log(chalk.blue('================================\n'));

console.log(chalk.yellow('Please follow these steps to execute the SQL migrations:\n'));

console.log(chalk.white('1. Open the Supabase Dashboard'));
console.log(chalk.white('2. Navigate to your project'));
console.log(chalk.white('3. Go to SQL Editor'));
console.log(chalk.white('4. Create a new query\n'));

console.log(chalk.yellow('Execute the following SQL files in order:\n'));

const migrationFiles = [
  '00_check_prerequisites.sql',
  '01_create_cases.sql',
  '02_create_case_files.sql',
  '03_create_case_products.sql',
  '04_create_case_product_teeth.sql',
  '05_create_case_stages.sql',
  '06_create_case_technicians.sql',
  'create_rls_helper.sql',
  '08_setup_rls.sql'
];

// Display each migration file and its contents
migrationFiles.forEach((file, index) => {
  const filePath = join(SQL_DIR, file);
  try {
    const contents = readFileSync(filePath, 'utf8');
    console.log(chalk.green(`File ${index + 1}: ${file}`));
    console.log(chalk.white('----------------------------------------'));
    console.log(chalk.white(contents));
    console.log('\n');
  } catch (error) {
    console.error(chalk.red(`Error reading ${file}:`, error));
  }
});

console.log(chalk.yellow('\nAlternatively, you can run all migrations at once:\n'));
console.log(chalk.white('1. Open 00_run_migrations.sql'));
console.log(chalk.white('2. Execute the entire file\n'));

console.log(chalk.yellow('After running migrations:\n'));
console.log(chalk.white('1. Run verify_migration.ts to check if tables were created'));
console.log(chalk.white('2. Run verify_rls.ts to verify RLS policies\n'));

console.log(chalk.blue('For any issues, check the error messages in the SQL Editor output.'));
