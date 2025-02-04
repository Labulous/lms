import { supabase } from "../lib/supabase";
import { createLogger } from "../utils/logger";
import { Database, labDetail } from "@/types/supabase";

const logger = createLogger({ module: "AuthService" });

const AUTH_TOKEN_KEY = "auth_token";

export interface CustomUser {
  id: string;
  email: string;
  role: "admin" | "technician" | "client" | "super_admin";
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

//owner of app . who will be super here.
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: "super_admin"
): Promise<void> => {
  try {
    logger.info("Starting user signup", { email, role });

    const labDetails = {
      super_admin_id: "", // This will be updated after the user's ID is created
      admin_ids: [],
      client_ids: [],
      technician_ids: [],
      office_address_id: "",
      name: "",
    };

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
          id: userId,
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

    // Create a lab entry with empty fields for the super admin
    const { data: labData, error: labError } = await supabase
      .from("lab")
      .insert([
        {
          super_admin_id: userId, // Link the super admin to this lab
          admin_ids: labDetails.admin_ids,
          client_ids: labDetails.client_ids,
          technician_ids: labDetails.technician_ids,
          office_address_id: labDetails.office_address_id,
        },
      ] as any);

    if (labError) {
      logger.error("Error creating lab entry", labError);
      throw labError;
    }

    logger.info("Lab entry created successfully", { labData });
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
export const createUserByAdmins = async (
  labId: string,
  // role: "admin" | "technician" | "client",
  role: string,
  name: string,
  firstname: string,
  lastname: string,
  email: string,
  phone: string,
  password: string,
  additionalClientFields?: {
    accountNumber: string;
    clientName: string;
    contactName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    clinicRegistrationNumber: string;
    notes: string;
  }
): Promise<void> => {
  try {
    // 1. Check if the email already exists in Auth and Users table
    // const { data: authData, error: authError } = await supabase
    //   .from("auth.users")
    //   .select("id")
    //   .eq("email", email);


    const { data: authData, error: authError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email);

    if (authError) {
      console.error("Error checking auth for existing email:", authError);
      throw new Error("Error checking for existing email in auth.");
    }

    if (authData.length > 0) {
      throw new Error("User already exists in Supabase Auth.");
    }

    // 2. Sign up the new user in Supabase Auth

    const adminSession = await supabase.auth.getSession(); // Save admin session
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Signup failed:", error);
      throw new Error("Signup failed for the new user.");
    }

    const newUserId = data.user?.id;
    if (!newUserId) {
      throw new Error("No user ID returned after signup.");
    }
    // Restore admin session if it was replaced
    if (adminSession?.data?.session) {
      await supabase.auth.setSession({
        access_token: adminSession.data.session.access_token,
        refresh_token: adminSession.data.session.refresh_token,
      });
    }


    // 3. Insert the new user into the 'users' table with the specified role
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: newUserId,
        name: name,
        email: email,
        firstname: firstname,
        lastname: lastname,
        lab_id: labId,
        phone: phone,
        role: role, // Set the role as provided
      },
    ]);

    if (insertError) {
      console.error("Error inserting user into users table:", insertError);
      throw insertError;
    }

    if (role === "client") {
      // 4. Insert additional fields into the `clients` table
      if (!additionalClientFields) {
        throw new Error(
          "Additional client fields are required for client role."
        );
      }

      const { error: clientInsertError } = await supabase
        .from("clients")
        .insert([
          {
            lab_id: labId,
            account_number: additionalClientFields.accountNumber,
            client_name: additionalClientFields.clientName,
            contact_name: additionalClientFields.contactName,
            phone: additionalClientFields.phone,
            email: email,
            street: additionalClientFields.street,
            city: additionalClientFields.city,
            state: additionalClientFields.state,
            zip_code: additionalClientFields.zipCode,
            clinic_registration_number:
              additionalClientFields.clinicRegistrationNumber,
            notes: additionalClientFields.notes,
          },
        ]);

      if (clientInsertError) {
        console.error(
          "Error inserting client into clients table:",
          clientInsertError
        );
        throw clientInsertError;
      }
    }

    // 5. Update the lab table to add the user ID or email to the appropriate field based on the role
    const fieldToUpdate =
      role === "admin"
        ? "admin_ids"
        : role === "technician"
          ? "technician_ids"
          : "client_ids"; // Add to client_ids for clients

    // Fetch the current IDs/emails for the specified field
    const { data: labData, error: fetchError } = await supabase
      .from("labs")
      .select(fieldToUpdate)
      .eq("id", labId)
      .single();

    if (fetchError) {
      console.error("Error fetching lab data:", fetchError);
      throw new Error("Error fetching lab data.");
    }
    const labResponse: any = labData;
    const currentIds = labResponse?.[fieldToUpdate] || [];
    const updatedIds =
      role === "client"
        ? [...currentIds, email] // For clients, use email
        : [...currentIds, newUserId]; // For others, use user ID

    // Update the lab table with the new list of IDs/emails
    const { error: updateError } = await supabase
      .from("labs")
      .update({ [fieldToUpdate]: updatedIds })
      .eq("id", labId);

    if (updateError) {
      console.error(`Error updating lab with new ${role} ID:`, updateError);
      throw updateError;
    }

    console.log(
      `${role.charAt(0).toUpperCase() + role.slice(1)
      } created and lab updated successfully!`
    );
  } catch (error) {
    console.error("Error in createUser function:", error);
    throw error;
  }
};

export const getLabIdByUserId = async (
  userId: string
): Promise<{ labId: string; name: string } | null> => {
  try {
    // Fetch all labs
    const { data: labs, error } = await supabase
      .from("labs")
      .select("id, super_admin_id, admin_ids, client_ids, name");

    if (error) {
      console.error("Error fetching labs:", error);
      throw new Error("Failed to fetch labs.");
    }

    if (!labs || labs.length === 0) {
      console.warn("No labs found.");
      return null;
    }

    // Check each lab for a matching userId
    for (const lab of labs) {
      const { id: labId, super_admin_id, admin_ids, client_ids, name } = lab;

      // Check if the userId matches any of the super_admin_id, admin_ids, or client_ids
      if (
        super_admin_id === userId ||
        (admin_ids && admin_ids.includes(userId)) ||
        (client_ids && client_ids.includes(userId))
      ) {
        return { labId, name }; // Return the matching lab_id
      }
    }

    // If no match is found, return null
    return null;
  } catch (error) {
    console.error("Error in getLabIdByUserId function:", error);
    throw error;
  }
};
export const getLabDataByUserId = async (
  userId: string
): Promise<labDetail | null> => {
  try {
    // Fetch all labs

    const { data, error } = await supabase
      .from("labs")
      .select(
        `
               name,
               id,
               office_address:office_address!office_address_id (
                 address_1,
                 address_2,
                 city,
                 state_province,
                 zip_postal,
                 country,
                 phone_number
               )
             `
      )
      .or(
        `super_admin_id.eq.${userId},admin_ids.cs.{${userId}},technician_ids.cs.{${userId}},client_ids.cs.{${userId}}`
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // If no match is found, return null
    return data as unknown as labDetail;
  } catch (error) {
    console.error("Error in getLabIdByUserId function:", error);
    throw error;
  }
};

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  logger.debug("Auth state changed", { event, userId: session?.user?.id });
});
