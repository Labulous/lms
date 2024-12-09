import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger({ module: 'AuthService' });

const AUTH_TOKEN_KEY = 'auth_token';

export interface CustomUser {
  id: string;
  email: string;
  role: 'admin' | 'technician' | 'client';
  name: string;
}

export const login = async (email: string, password: string): Promise<void> => {
  try {
    logger.info('Attempting login', { email, timestamp: new Date().toISOString() });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Login failed', {
        error: {
          message: error.message,
          status: error.status,
          name: error.name
        }
      });
      throw error;
    }

    logger.info('Login successful', {
      userId: data.user?.id,
      email: data.user?.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Unexpected error during login', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    logger.info('Logging out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Logout failed', error);
      throw error;
    }
    logger.info('Logout successful');
  } catch (error) {
    logger.error('Unexpected error during logout', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  const isAuth = !!session;
  logger.debug('Authentication check', { isAuthenticated: isAuth });
  return isAuth;
};

export const getCurrentUser = async (): Promise<CustomUser | null> => {
  try {
    logger.debug('Getting current user from Supabase');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      logger.error('Error getting auth user', { error: authError });
      throw authError;
    }

    if (!authUser) {
      logger.debug('No authenticated user found');
      return null;
    }

    logger.debug('Auth user found, fetching profile data', { userId: authUser.id });

    // Fetch user profile data
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        // Record not found, create new user profile
        logger.info('Creating new user profile', { userId: authUser.id });
        const newUser: CustomUser = {
          id: authUser.id,
          email: authUser.email!,
          role: 'admin', // Default role
          name: authUser.email!.split('@')[0],
        };

        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (insertError) {
          logger.error('Failed to create user profile', { error: insertError });
          throw insertError;
        }

        logger.info('User profile created successfully', { userId: newUser.id });
        return insertedUser || newUser;
      }

      logger.error('Error fetching user profile', { error: dbError });
      throw dbError;
    }

    if (!userData) {
      logger.warn('No user profile found', { userId: authUser.id });
      return null;
    }

    const customUser: CustomUser = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name,
    };

    logger.debug('User data retrieved successfully', { 
      userId: customUser.id,
      role: customUser.role
    });

    return customUser;
  } catch (error) {
    logger.error('Unexpected error in getCurrentUser', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    throw error;
  }
};

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: 'client' | 'technician'
): Promise<void> => {
  try {
    logger.info('Starting user signup', { email, role });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.error('Signup failed', error);
      throw error;
    }

    logger.info('Signup successful', { userId: data.user?.id });

    // Insert the user's custom data
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          name,
          role,
        }
      ]);

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(data.user.id);
      logger.error('Error creating user profile', profileError);
      throw profileError;
    }
  } catch (error) {
    logger.error('Unexpected error during signup', error);
    throw error;
  }
};

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  logger.debug('Auth state changed', { event, userId: session?.user?.id });
});