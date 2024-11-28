import { checkAndSetAdminRole } from '../src/utils/adminUtils';

const userId = '4f877403-fe4f-4810-ad33-a0c7bde741bb';

async function main() {
  try {
    await checkAndSetAdminRole(userId);
    console.log('✅ Admin role check/update completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
