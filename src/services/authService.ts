import { supabase } from "../lib/supabase";
import { createLogger } from "../utils/logger";
import { Database } from "@/types/supabase";

const logger = createLogger({ module: "AuthService" });

const AUTH_TOKEN_KEY = "auth_token";

export interface CustomUser {
  id: string;
  email: string;
  role: "admin" | "technician" | "client";
  name: string;
}
type User = Database["public"]["Tables"]["users"]["Row"];

export const login = async (email: string, password: string): Promise<void> => {
  try {
    logger.info("Attempting login", {
      email,
      timestamp: new Date().toISOString(),
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Login failed", {
        error: {
          message: error.message,
          status: error.status,
          name: error.name,
        },
      });
      throw error;
    }

    logger.info("Login successful", {
      userId: data.user?.id,
      email: data.user?.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Unexpected error during login", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : error,
    });
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    logger.info("Logging out user");
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error("Logout failed", error);
      throw error;
    }
    logger.info("Logout successful");
  } catch (error) {
    logger.error("Unexpected error during logout", error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuth = !!session;
  logger.debug("Authentication check", { isAuthenticated: isAuth });
  return isAuth;
};

export const getCurrentUser = async () => {
  try {
    logger.debug("Getting current user from Supabase");

    // Fetch the authenticated user from Supabase Auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logger.error("Error getting authenticated user", { error: authError });
      throw authError;
    }

    // If no authenticated user found, return null
    if (!authUser) {
      logger.debug("No authenticated user found");
      return null;
    }

    logger.debug("Authenticated user found, fetching profile data", {
      userId: authUser.id,
      role: authUser,
    });

    // Step 1: Fetch the user profile data from the 'users' table
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("id, name, role, email")
      .eq("id", authUser.id)
      .single(); // This ensures only one user is fetched

    // Step 2: Handle database error
    if (dbError) {
      logger.error("Error fetching user profile", { error: dbError });
      throw dbError;
    }

    // Step 3: Check if user data exists
    if (!userData) {
      logger.warn("No user profile found", { userId: authUser.id });
      return null;
    }

    // Step 4: Ensure that userData is valid
    if (
      "id" in userData &&
      "name" in userData &&
      "email" in userData &&
      "role" in userData
    ) {
      const customUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };

      logger.debug("User data retrieved successfully here", {
        userId: customUser.id,
        role: customUser.role,
      });

      return customUser;
    } else {
      logger.error("User data is malformed", { userData });
      return null;
    }
  } catch (error) {
    logger.error("Unexpected error in getCurrentUser", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    throw error;
  }
};

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: "client" | "technician"
): Promise<void> => {
  try {
    logger.info("Starting user signup", { email, role });

    // Attempt to sign up the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.error("Signup failed", error);
      throw error;
    }

    // Ensure we have a valid user ID
    const userId = data.user?.id;
    if (!userId) {
      logger.error("Signup succeeded, but no user ID found");
      throw new Error("No user ID returned after signup");
    }

    logger.info("Signup successful", { userId });

    // Insert the user's custom profile data without including the auto-generated `id`
    const { data: insertedUser, error: profileError } = await supabase
      .from("users")
      .insert([
        {
          email,
          name,
          role,
        },
      ] as any);

    if (profileError) {
      logger.error("Error creating user profile", profileError);
      throw profileError;
    }

    logger.info("User profile created successfully", { userId, insertedUser });
  } catch (error) {
    logger.error("Unexpected error during signup", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : error,
    });
    throw error;
  }
};

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  logger.debug("Auth state changed", { event, userId: session?.user?.id });
});
