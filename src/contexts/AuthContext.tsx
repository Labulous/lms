import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser, CustomUser } from "../services/authService";
import { createLogger } from "../utils/logger";
import { Database } from "@/types/supabase";

const logger = createLogger({ module: "AuthContext" });

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
type User = Database["public"]["Tables"]["users"]["Row"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const initializationComplete = useRef(false);
  const fetchingUserData = useRef(false);

  const handleError = useCallback((error: unknown, context: string) => {
    if (!mounted.current) return;
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`${context}: ${errorMessage}`, { error });
    setError(error instanceof Error ? error : new Error(errorMessage));
    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!mounted.current || fetchingUserData.current) return;

    fetchingUserData.current = true;
    try {
      logger.debug("Fetching user data");
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) {
        setUser(null);
        localStorage.removeItem("user");
        setLoading(false);
        return;
      }

      const userData = await getCurrentUser();
      if (!mounted.current) return;

      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      handleError(error, "Failed to fetch user data");
    } finally {
      if (mounted.current) setLoading(false);
      fetchingUserData.current = false;
    }
  }, [handleError]);

  useEffect(() => {
    if (!user) fetchUserData();
  }, [fetchUserData, user]);

  const handleAuthChange = useCallback(
    async (event: string, session: any) => {
      if (!mounted.current || initializationComplete.current) return;
      switch (event) {
        case "SIGNED_IN":
        case "INITIAL_SESSION":
          if (session) {
            setLoading(true);
            await fetchUserData();
          } else {
            setLoading(false);
          }
          break;
        case "SIGNED_OUT":
        case "USER_DELETED":
          setUser(null);
          localStorage.removeItem("user");
          setLoading(false);
          break;
        case "TOKEN_REFRESHED":
          if (session) await fetchUserData();
          break;
      }
    },
    [fetchUserData]
  );

  useEffect(() => {
    mounted.current = true;
    let authListener: any;

    const initialize = async () => {
      if (initializationComplete.current) return;
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        await handleAuthChange("INITIAL_SESSION", session);
      } catch (error) {
        handleError(error, "Failed to get initial session");
      } finally {
        initializationComplete.current = true;
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") {
        handleAuthChange(event, session);
      }
    });

    authListener = subscription;

    return () => {
      mounted.current = false;
      authListener?.unsubscribe();
    };
  }, [handleAuthChange, handleError]);

  const signOut = async () => {
    localStorage.removeItem("user");
    if (!mounted.current) return;
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("user");
      setError(null);
    } catch (error) {
      handleError(error, "Sign out failed");
    } finally {
      localStorage.removeItem("user");

      if (mounted.current) setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
