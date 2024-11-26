import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger({ module: 'SupabaseConfig' });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase environment variables', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Supabase configuration is missing. Check your environment variables.');
}

logger.debug('Initializing Supabase client', {
  url: supabaseUrl
});

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'labulous_auth_token',
    flowType: 'pkce'
  },
  persistSession: true,
  // Add debug logging for Supabase client
  debug: true
});

// Log when the client is ready
supabase.auth.onAuthStateChange((event, session) => {
  logger.debug('Supabase auth state changed', {
    event,
    hasSession: !!session,
    userId: session?.user?.id
  });
});

// Verify session on initialization
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    logger.error('Error getting initial session', { error });
    return;
  }
  
  if (session) {
    logger.debug('Initial session found', {
      userId: session.user.id,
      expiresAt: session.expires_at
    });
  } else {
    logger.debug('No initial session found');
  }
});
