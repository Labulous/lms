import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ module: 'AuthDebug' });

const AuthDebug: React.FC = () => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    logger.debug('AuthDebug state', { 
      hasUser: !!user, 
      loading,
      userDetails: user ? {
        id: user.id,
        role: user.role,
        email: user.email
      } : null
    });
  }, [user, loading]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg opacity-75 text-sm">
      <pre>
        {JSON.stringify({ user, loading }, null, 2)}
      </pre>
    </div>
  );
};

export default AuthDebug;
