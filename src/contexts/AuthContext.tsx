import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, CustomUser } from '../services/authService';
import { createLogger } from '../utils/logger';

const logger = createLogger({ module: 'AuthContext' });

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const initializationComplete = useRef(false);
  const fetchingUserData = useRef(false);

  const handleError = useCallback((error: unknown, context: string) => {
    if (!mounted.current) return;
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error(`${context}: ${errorMessage}`, { error });
    setError(error instanceof Error ? error : new Error(errorMessage));
    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!mounted.current || fetchingUserData.current) return;
    
    fetchingUserData.current = true;
    try {
      logger.debug('Fetching user data');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authUser) {
        logger.debug('No authenticated user found');
        if (mounted.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      logger.debug('Auth user found, getting user data', { userId: authUser.id });
      const userData = await getCurrentUser();

      if (!mounted.current) return;

      if (userData) {
        logger.info('User data retrieved successfully', { userId: userData.id, role: userData.role });
        setUser(userData);
      } else {
        logger.warn('No user data found after getCurrentUser');
        setUser(null);
      }
    } catch (error) {
      if (mounted.current) {
        handleError(error, 'Failed to fetch user data');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
      fetchingUserData.current = false;
    }
  }, [handleError]);

  const handleAuthChange = useCallback(async (event: string, session: any) => {
    if (!mounted.current || (initializationComplete.current && event === 'INITIAL_SESSION')) {
      logger.debug('Skipping auth change', { 
        event, 
        isInitialized: initializationComplete.current,
        isMounted: mounted.current 
      });
      return;
    }

    logger.debug('Processing auth change', {
      event,
      userId: session?.user?.id,
      hasUser: !!user,
      isInitialized: initializationComplete.current
    });

    switch (event) {
      case 'SIGNED_IN':
      case 'INITIAL_SESSION':
        if (session) {
          setLoading(true);
          await fetchUserData();
        } else if (event === 'INITIAL_SESSION') {
          setLoading(false);
        }
        break;

      case 'SIGNED_OUT':
      case 'USER_DELETED':
        setUser(null);
        setLoading(false);
        break;

      case 'TOKEN_REFRESHED':
        if (session) {
          await fetchUserData();
        }
        break;

      default:
        logger.debug(`Unhandled auth event: ${event}`);
    }
  }, [fetchUserData, user]);

  useEffect(() => {
    logger.debug('Initializing AuthContext');
    mounted.current = true;
    let authListener: any;

    const initialize = async () => {
      if (initializationComplete.current) {
        logger.debug('Already initialized');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        await handleAuthChange('INITIAL_SESSION', session);
      } catch (error) {
        handleError(error, 'Failed to get initial session');
      } finally {
        initializationComplete.current = true;
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') {
        handleAuthChange(event, session);
      }
    });

    authListener = subscription;

    return () => {
      logger.debug('AuthProvider cleanup');
      mounted.current = false;
      authListener?.unsubscribe();
    };
  }, [handleAuthChange, handleError]);

  const signOut = async () => {
    if (!mounted.current) return;

    try {
      logger.info('Starting sign out');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      handleError(error, 'Sign out failed');
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const contextValue = {
    user,
    loading,
    error,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
