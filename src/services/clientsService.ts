import { supabase, supabaseServiceRole } from "../lib/supabase";
import { createLogger } from "../utils/logger";
import { validateAccountNumber } from "../utils/accountNumberFormatter";

const logger = createLogger({ module: "ClientsService" });

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Doctor {
  id?: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Client {
  id: string;
  accountNumber: string;
  clientName: string;
  contactName: string;
  phone: string;
  email: string;
  address: Address;
  status?: string | undefined | any;
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
  created_at?: string;
  updated_at?: string;
}
export interface ClientType {
  id?: string;
  client_name?: string;
  account_number?: string;
}

export interface ClientInput
  extends Omit<
    Client,
    "id" | "accountNumber" | "doctors" | "created_at" | "updated_at"
  > {
  accountNumber?: string;
  account_number?: string;
  lab_id?: string;

  doctors?: Omit<Doctor, "id">[];
}
class ClientsService {
  // private async generateAccountNumber(): Promise<string> {
  //   const { count } = await supabase
  //     .from("clients")
  //     .select("*", { count: "exact", head: true });

  //   const nextNumber = (count ?? 0) + 1;
  //   return `24${String(nextNumber).padStart(4, "0")}`;
  // }

  private transformClientFromDB(client: any, doctors: any[] = []): Client {
    try {
      logger.info("Transforming client from DB", {
        clientId: client.id,
        hasClient: !!client,
        hasDoctors: !!doctors,
        doctorsCount: doctors?.length,
      });

      const transformedClient = {
        id: client.id,
        accountNumber: client.account_number,
        clientName: client.client_name,
        contactName: client.contact_name,
        phone: client.phone,
        email: client.email,
        address: {
          street: client.street,
          city: client.city,
          state: client.state,
          zipCode: client.zip_code,
        },
        clinicRegistrationNumber: client.clinic_registration_number,
        notes: client.notes,
        doctors:
          doctors?.map((doctor) => ({
            id: doctor.id,
            name: doctor.name,
            phone: doctor.phone,
            email: doctor.email,
            notes: doctor.notes,
          })) || [],
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      };

      logger.info("Client transformed successfully", {
        clientId: transformedClient.id,
        hasAddress: !!transformedClient.address,
        doctorsCount: transformedClient.doctors.length,
      });

      return transformedClient;
    } catch (error) {
      logger.error("Error transforming client from DB", {
        error,
        clientId: client?.id,
        clientData: client,
        doctorsData: doctors,
      });
      throw new Error("Failed to transform client data");
    }
  }

  private transformClientToDB(client: ClientInput) {
    return {
      client_name: client.clientName,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      street: client.address?.street,
      city: client.address?.city,
      state: client.address?.state,
      zip_code: client.address?.zipCode,
      clinic_registration_number: client.clinicRegistrationNumber,
      notes: client.notes,
      account_number: client.accountNumber, // Keep the account number when updating
      lab_id: client.lab_id,
    };
  }

  private transformDoctorToDB(doctor: Omit<Doctor, "id">) {
    return {
      name: doctor.name,
      phone: doctor.phone,
      email: doctor.email,
      notes: doctor.notes,
    };
  }

  async getClients(labId: string): Promise<Client[]> {
    try {
      logger.debug("Starting getClients request");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        logger.error("Error getting authenticated user", { authError });
        throw authError;
      }

      if (!authUser) {
        logger.debug("No authenticated user found");
        return [];
      }

      logger.debug("Authenticated user found", { userId: authUser.id });

      const { data: userRoleData, error: userRoleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (userRoleError) {
        logger.error("Error fetching user role", { userRoleError });
        throw userRoleError;
      }
      const uthenicated: any = userRoleData;
      if (!userRoleData || !uthenicated.role) {
        logger.error("User role not found in the database", {
          userId: authUser.id,
        });
        throw new Error("User role not found");
      }

      const userRole: any = userRoleData;

      if (
        !["admin", "technician", "super_admin", "client"].includes(
          userRole.role
        )
      ) {
        logger.error("User does not have required role", {
          role: userRole.role,
        });
        throw new Error("Insufficient permissions to view clients");
      }

      logger.debug("Fetching all clients...");
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("lab_id", labId)
        .order("client_name", { ascending: true });

      if (clientsError) {
        logger.error("Error fetching clients", {
          error: clientsError,
          message: clientsError.message,
          hint: clientsError.hint,
          details: clientsError.details,
        });
        throw new Error(`Failed to fetch clients: ${clientsError.message}`);
      }

      if (!clients) {
        logger.warn("No clients found in database");
        return [];
      }

      logger.debug("Successfully fetched clients", {
        count: clients.length,
        clients,
        clientsError,
      });

      const clientsWithDoctors = await Promise.all(
        clients.map(async (client: any) => {
          try {
            const { data: doctors, error: doctorsError } = await supabase
              .from("doctors")
              .select("*")
              .eq("client_id", client.id);

            if (doctorsError) {
              logger.error("Error fetching doctors for client", {
                clientId: client.id,
                error: doctorsError,
              });
              return this.transformClientFromDB(client, []);
            }

            return this.transformClientFromDB(client, doctors || []);
          } catch (error) {
            logger.error("Error processing client", {
              clientId: client.id,
              error,
            });
            return this.transformClientFromDB(client, []);
          }
        })
      );

      logger.info("Successfully processed all clients", {
        totalClients: clientsWithDoctors.length,
        clientIds: clientsWithDoctors.map((c) => c.id),
      });

      return clientsWithDoctors;
    } catch (error) {
      logger.error("Unexpected error in getClients", {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      logger.info("Fetching client details", { id });

      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        logger.error("Error fetching client from database", { id, error });
        throw new Error(`Error fetching client: ${error.message}`);
      }

      if (!client) {
        logger.warn("No client found with id", { id });
        return null;
      }

      const typedClient = client as unknown as ClientType;

      logger.info("Raw client data from DB", {
        client: typedClient,
        hasData: !!typedClient,
        fields: typedClient ? Object.keys(typedClient) : [],
        id: typedClient.id,
        accountNumber: typedClient.account_number,
        clientName: typedClient.client_name,
      });

      const { data: doctors, error: doctorsError } = await supabase
        .from("doctors")
        .select("*")
        .eq("client_id", id);

      if (doctorsError) {
        logger.error("Error fetching doctors for client", {
          clientId: id,
          error: doctorsError,
        });
        return this.transformClientFromDB(typedClient, []);
      }

      const transformedClient = this.transformClientFromDB(
        typedClient,
        doctors || []
      );

      return transformedClient;
    } catch (error) {
      logger.error("Error in getClientById", { id, error });
      throw error;
    }
  }

  async addClient(clientData: ClientInput): Promise<Client> {
    try {
      const { data: nextNumber, error: numberError } = await supabase.rpc(
        "get_next_account_number"
      );

      if (numberError) throw numberError;

      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          ...this.transformClientToDB(clientData),
          account_number: nextNumber as number,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const clients = client as unknown as ClientType;
      if (clientData.doctors && clientData.doctors.length > 0) {
        const { error: doctorsError } = await supabase.from("doctors").insert(
          clientData.doctors.map(
            (doctor) =>
            ({
              ...this.transformDoctorToDB(doctor),
              client_id: clients.id,
            } as any)
          )
        );

        if (doctorsError) throw doctorsError;
      }

      return this.getClientById(clients.id as string) as Promise<Client>;
    } catch (error) {
      logger.error("Error adding client", { error });
      throw error;
    }
  }

  async updateClient(id: string, clientData: ClientInput): Promise<Client> {
    try {
      // First, update the client data
      const { error: clientError } = await supabase
        .from("clients")
        .update(this.transformClientToDB(clientData) as any)
        .eq("id", id);

      if (clientError) throw clientError;

      // Only update doctors if the doctors array is explicitly provided
      if (clientData.doctors !== undefined) {
        // Get current doctors to check if we need to update
        const { data: currentDoctors, error: fetchError } = await supabase
          .from("doctors")
          .select("*")
          .eq("client_id", id);

        if (fetchError) {
          logger.error("Error fetching current doctors", { fetchError });
          throw fetchError;
        }

        // Compare current doctors with new doctors to see if we need to update
        const currentDoctorsSet = new Set(
          currentDoctors.map(
            (d) => `${d.name}|${d.email}|${d.phone}|${d.notes}`
          )
        );
        const newDoctorsSet = new Set(
          clientData.doctors.map(
            (d) => `${d.name}|${d.email}|${d.phone}|${d.notes}`
          )
        );

        // Only update if there are actual changes
        if (
          currentDoctors.length !== clientData.doctors.length ||
          ![...currentDoctorsSet].every((d) => newDoctorsSet.has(d))
        ) {
          // First try to update existing doctors instead of deleting
          for (let i = 0; i < clientData.doctors.length; i++) {
            const doctor = clientData.doctors[i];
            const currentDoctor = currentDoctors[i];

            if (currentDoctor) {
              // Update existing doctor
              const { error: updateError } = await supabase
                .from("doctors")
                .update({
                  ...this.transformDoctorToDB(doctor),
                  client_id: id,
                })
                .eq("id", currentDoctor.id);

              if (updateError) {
                logger.error("Error updating doctor", { updateError, doctor });
                throw updateError;
              }
            } else {
              // Insert new doctor
              const { error: insertError } = await supabase
                .from("doctors")
                .insert({
                  ...this.transformDoctorToDB(doctor),
                  client_id: id,
                });

              if (insertError) {
                logger.error("Error inserting doctor", { insertError, doctor });
                throw insertError;
              }
            }
          }

          // Remove any excess doctors
          if (currentDoctors.length > clientData.doctors.length) {
            const doctorsToKeep = currentDoctors.slice(
              0,
              clientData.doctors.length
            );
            const { error: deleteError } = await supabase
              .from("doctors")
              .delete()
              .eq("client_id", id)
              .not("id", "in", `(${doctorsToKeep.map((d) => d.id).join(",")})`);

            if (deleteError) {
              logger.error("Error removing excess doctors", { deleteError });
              throw deleteError;
            }
          }
        }
      }

      // Return the updated client
      return this.getClientById(id) as Promise<Client>;
    } catch (error) {
      logger.error("Error updating client", { error });
      throw error;
    }
  }

  async updateClientUserDetails(id: string, userId: string, clientData: ClientInput): Promise<Client> {
    try {
      console.log("test=>" + JSON.stringify(clientData, null, 2));
      console.log(clientData.clientName);

      // Fetch the current client data to check if the email is changing
      const { data: existingClient, error: fetchError } = await supabaseServiceRole
        .from("clients")
        .select("email")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching existing client data:", fetchError);
        throw fetchError;
      }

      const currentEmail = existingClient?.email;
      const newEmail = clientData.email;

      if (currentEmail !== newEmail) {
        // Check if a pending approval already exists
        const { data: existingApproval, error: approvalFetchError } = await supabaseServiceRole
          .from("pending_approvals")
          .select("id, status")
          .eq("client_id", id)
          .eq("user_id", userId)
          .eq("new_email", newEmail)
          .maybeSingle(); // Returns null if no record found

        if (approvalFetchError) {
          console.error("Error fetching pending approvals:", approvalFetchError);
          throw approvalFetchError;
        }

        if (!existingApproval || existingApproval.status === "approved") {
          // Insert a new approval request only if no pending record exists or previous request was approved
          const { error: approvalError } = await supabaseServiceRole
            .from("pending_approvals")
            .insert({
              client_id: id,
              user_id: userId,
              new_email: newEmail,
              status: "pending",
              previous_email: currentEmail,
              client_name: clientData.clientName,
              requested_at: new Date(),
            });

          if (approvalError) {
            console.error("Error inserting into pending approvals:", approvalError);
            throw approvalError;
          }

          console.log("New email change request added to pending approvals.");
        } else {
          console.log("Pending approval request already exists. Skipping insertion.");
        }
      }

      // Update client details (excluding email if it has changed)
      const { error: clientError } = await supabaseServiceRole
        .from("clients")
        .update({
          client_name: clientData.clientName,
          contact_name: clientData.contactName,
          phone: clientData.phone,
          street: clientData.address?.street,
          city: clientData.address?.city,
          state: clientData.address?.state,
          zip_code: clientData.address?.zipCode,
          clinic_registration_number: clientData.clinicRegistrationNumber,
          notes: clientData.notes,
          account_number: clientData.accountNumber,
          ...(currentEmail === newEmail && { email: newEmail }), // Only update email if unchanged
        })
        .eq("id", id);

      if (clientError) {
        console.error("Error updating client data:", clientError);
        throw clientError;
      }

      console.log("Client details updated successfully.");

      // Proceed with updating doctors if provided
      if (clientData.doctors !== undefined) {
        const { data: currentDoctors, error: fetchError } = await supabaseServiceRole
          .from("doctors")
          .select("*")
          .eq("client_id", id);

        if (fetchError) {
          logger.error("Error fetching current doctors", { fetchError });
          throw fetchError;
        }

        const currentDoctorsSet = new Set(
          currentDoctors.map(d => `${d.name}|${d.email}|${d.phone}|${d.notes}`)
        );
        const newDoctorsSet = new Set(
          clientData.doctors.map(d => `${d.name}|${d.email}|${d.phone}|${d.notes}`)
        );

        if (currentDoctors.length !== clientData.doctors.length ||
          ![...currentDoctorsSet].every(d => newDoctorsSet.has(d))) {

          for (let i = 0; i < clientData.doctors.length; i++) {
            const doctor = clientData.doctors[i];
            const currentDoctor = currentDoctors[i];

            if (currentDoctor) {
              const { error: updateError } = await supabaseServiceRole
                .from("doctors")
                .update({
                  ...this.transformDoctorToDB(doctor),
                  client_id: id,
                })
                .eq("id", currentDoctor.id);

              if (updateError) {
                logger.error("Error updating doctor", { updateError, doctor });
                throw updateError;
              }
            } else {
              const { error: insertError } = await supabaseServiceRole
                .from("doctors")
                .insert({
                  ...this.transformDoctorToDB(doctor),
                  client_id: id,
                });

              if (insertError) {
                logger.error("Error inserting doctor", { insertError, doctor });
                throw insertError;
              }
            }
          }

          if (currentDoctors.length > clientData.doctors.length) {
            const doctorsToKeep = currentDoctors.slice(0, clientData.doctors.length);
            const { error: deleteError } = await supabaseServiceRole
              .from("doctors")
              .delete()
              .eq("client_id", id)
              .not("id", "in", `(${doctorsToKeep.map(d => d.id).join(",")})`);

            if (deleteError) {
              logger.error("Error removing excess doctors", { deleteError });
              throw deleteError;
            }
          }
        }
      }

      return this.getClientById(id) as Promise<Client>;
    } catch (error) {
      logger.error("Error updating client", { error });
      throw error;
    }
  }


  async deleteClient(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      logger.error("Error deleting client", { id, error });
      throw error;
    }
  }

  async getClientIdByUserEmail(email: string): Promise<string | null> {
    try {
      logger.debug("Starting getClient request");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        logger.error("Error getting authenticated user", { authError });
        throw authError;
      }

      if (!authUser) {
        logger.debug("No authenticated user found");
        return null;
      }

      logger.debug("Authenticated user found", { userId: authUser.id });

      const { data: userRoleData, error: userRoleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (userRoleError) {
        logger.error("Error fetching user role", { userRoleError });
        throw userRoleError;
      }

      if (!userRoleData || !userRoleData.role) {
        logger.error("User role not found in the database", {
          userId: authUser.id,
        });
        throw new Error("User role not found");
      }

      const userRole: any = userRoleData;

      if (
        !["admin", "technician", "super_admin", "client"].includes(
          userRole.role
        )
      ) {
        logger.error("User does not have required role", {
          role: userRole.role,
        });
        throw new Error("Insufficient permissions to view clients");
      }

      logger.debug("Fetching client...");
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id") // Only select `id`
        .eq("email", email)
        .single();

      if (clientError) {
        logger.error("Error fetching client", {
          error: clientError,
          message: clientError.message,
          hint: clientError.hint,
          details: clientError.details,
        });
        throw new Error(`Failed to fetch client: ${clientError.message}`);
      }

      if (!client) {
        logger.warn("Client not found in database");
        return null;
      }

      logger.debug("Client found", { clientId: client.id });

      return client.id; // Return only the client `id`
    } catch (error) {
      logger.error("Unexpected error in getClient", {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  async getClient(clientId: string): Promise<Client | null> {
    try {
      logger.debug("Starting getClient request");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        logger.error("Error getting authenticated user", { authError });
        throw authError;
      }

      if (!authUser) {
        logger.debug("No authenticated user found");
        return null;
      }

      logger.debug("Authenticated user found", { userId: authUser.id });

      const { data: userRoleData, error: userRoleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (userRoleError) {
        logger.error("Error fetching user role", { userRoleError });
        throw userRoleError;
      }

      if (!userRoleData || !userRoleData.role) {
        logger.error("User role not found in the database", {
          userId: authUser.id,
        });
        throw new Error("User role not found");
      }

      const userRole: any = userRoleData;

      if (
        !["admin", "technician", "super_admin", "client"].includes(
          userRole.role
        )
      ) {
        logger.error("User does not have required role", {
          role: userRole.role,
        });
        throw new Error("Insufficient permissions to view clients");
      }

      logger.debug("Fetching client...");
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) {
        logger.error("Error fetching client", {
          error: clientError,
          message: clientError.message,
          hint: clientError.hint,
          details: clientError.details,
        });
        throw new Error(`Failed to fetch client: ${clientError.message}`);
      }

      if (!client) {
        logger.warn("Client not found in database");
        return null;
      }

      logger.debug("Fetching doctors for client...");
      const { data: doctors, error: doctorsError } = await supabase
        .from("doctors")
        .select("*")
        .eq("client_id", client.id);

      if (doctorsError) {
        logger.error("Error fetching doctors for client", {
          clientId: client.id,
          error: doctorsError,
        });
        return this.transformClientFromDB(client, []);
      }

      logger.info("Successfully fetched client and doctors", {
        clientId: client.id,
      });

      return this.transformClientFromDB(client, doctors || []);
    } catch (error) {
      logger.error("Unexpected error in getClient", {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }
}

export const clientsService = new ClientsService();
