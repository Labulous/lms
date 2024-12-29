import { supabase } from "../lib/supabase";
import { createLogger } from "./logger";

const logger = createLogger({ module: "AdminUtils" });

export async function checkAndSetAdminRole(userId: string): Promise<void> {
  try {
    // Fetch the current user data from the 'users' table
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    // Check for errors in fetching the user data
    if (error) {
      logger.error("Error fetching user", { error });
      throw error; // Propagate the error to be handled outside
    }

    // Ensure that `data` is not undefined or null
    if (!data) {
      logger.error("User not found", { userId });
      throw new Error("User not found");
    }

    // Destructure the user data and safely access `role`
    const { role } = data as unknown as {
      role: "client" | "technician" | "admin" | "super_admin";
    };

    // Log the current user data for debugging
    logger.info("Current user data", { data });

    // Check if the current role is not 'admin'
    if (role !== "admin" && role !== "super_admin") {
      // Update the user role to 'admin' using our custom RPC function
      const { error: updateError } = await supabase.rpc("update_user_role", {
        user_id: userId,
        new_role: "admin",
      });

      if (updateError) {
        logger.error("Error updating user role to admin", { updateError });
        throw updateError;
      }

      logger.info("Successfully updated user role to admin", { userId });
    } else {
      logger.info("User is already an admin", { userId });
    }
  } catch (error) {
    // Log any unexpected errors that occur during the process
    logger.error("Error in checkAndSetAdminRole", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    throw error;
  }
}
