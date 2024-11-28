import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase URL and key from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const userId = '4f877403-fe4f-4810-ad33-a0c7bde741bb';

async function checkAndSetAdminRole() {
  try {
    console.log('🔍 Checking current user role...');
    
    // First check current role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      throw userError;
    }

    console.log('📊 Current user data:', user);

    if (user?.role !== 'admin') {
      console.log('🔄 Updating user role to admin...');
      
      // Update to admin role using our custom function
      const { error: updateError } = await supabase
        .rpc('update_user_role', {
          user_id: userId,
          new_role: 'admin'
        });

      if (updateError) {
        console.error('❌ Error updating user role:', updateError);
        throw updateError;
      }

      console.log('✅ Successfully updated user role to admin');
    } else {
      console.log('✅ User is already an admin');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkAndSetAdminRole()
  .then(() => {
    console.log('✨ Operation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  });
