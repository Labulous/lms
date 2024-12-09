import { supabase } from '../lib/supabase';
import { createLogger } from './logger';

const logger = createLogger({ module: 'AdminUtils' });

export async function checkAndSetAdminRole(userId: string): Promise<void> {
  try {
    // First check current role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      logger.error('Error fetching user', { userError });
      throw userError;
    }

    logger.info('Current user data', { user });

    if (user?.role !== 'admin') {
      // Update to admin role using our custom function
      const { error: updateError } = await supabase
        .rpc('update_user_role', {
          user_id: userId,
          new_role: 'admin'
        });

      if (updateError) {
        logger.error('Error updating user role', { updateError });
        throw updateError;
      }

      logger.info('Successfully updated user role to admin');
    } else {
      logger.info('User is already an admin');
    }
  } catch (error) {
    logger.error('Error in checkAndSetAdminRole', { error });
    throw error;
  }
}
