import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../services/authService";
import { createLogger } from "../utils/logger";
import { Database } from "@/types/supabase";

const logger = createLogger({ module: "AuthContext" });

interface AuthContextType {
  user: Database["public"]["Tables"]["users"]["Row"] | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<
    Database["public"]["Tables"]["users"]["Row"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const initializationComplete = useRef(false);
  const [initialized, setInitialized] = useState(false);

  const handleError = useCallback((error: unknown, context: string) => {
    if (!mounted.current) return;
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`${context}: ${errorMessage}`, { error });
    setError(error instanceof Error ? error : new Error(errorMessage));
    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!mounted.current) return;

    try {
      logger.debug("Fetching user data");
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authUser) {
        logger.debug("No authenticated user found");
        if (mounted.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      logger.debug("Auth user found, getting user data", {
        userId: authUser.id,
      });
      const userData = await getCurrentUser();
      if (!mounted.current) return;
      if (userData) {
        logger.info("User data retrieved successfully", {
          userId: userData.id,
          role: userData.role,
        });
        setUser(userData);
      } else {
        logger.warn("No user data found after getCurrentUser");
        setUser(null);
      }
    } catch (error) {
      if (mounted.current) {
        handleError(error, "Failed to fetch user data");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [handleError]);

  const handleAuthChange = useCallback(
    async (event: string, session: any) => {
      if (!mounted.current) return;

      logger.debug("Processing auth change", {
        event,
        userId: session?.user?.id,
        hasUser: !!user,
      });

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && !user) {
        await fetchUserData();
      }

      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        setUser(null);
        setLoading(false);
      }
    },
    [fetchUserData, user]
  );

  useEffect(() => {
    logger.debug("Initializing AuthContext");
    mounted.current = true;

    const initialize = async () => {
      if (initialized || initializationComplete.current) return;

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          await handleAuthChange("INITIAL_SESSION", session);
        } else {
          setLoading(false);
        }
      } catch (error) {
        handleError(error, "Failed to get initial session");
      } finally {
        initializationComplete.current = true;
        setInitialized(true); // Ensure it does not run again
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      logger.debug("AuthProvider cleanup");
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthChange, handleError, initialized]);

  const signOut = async () => {
    if (!mounted.current) return;

    try {
      logger.info("Starting sign out");
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      handleError(error, "Sign out failed");
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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
