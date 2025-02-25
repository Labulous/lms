import { supabase } from "../lib/supabase";
import { createLogger } from "../utils/logger";
import { validateAccountNumber } from "../utils/accountNumberFormatter";

const logger = createLogger({ module: "ClientsService" });

export interface Address {
  country: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
}

export interface Doctor {
  id?: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  order: number;
}

export interface Client {
  id: string;
  accountNumber: string;
  clientName: string;
  contactName: string;
  phone: string;
  additionalPhone?: string;
  email: string;
  billingEmail?: string;
  otherEmail?: string[];
  address: Address;
  billingAddress: Address;
  status?: string;
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
  created_at?: string;
  updated_at?: string;
  taxRate?: number;
  salesRepName?: string;
  salesRepNote?: string;
  additionalLeadTime?: number;
}

export interface ClientType {
  id?: string;
  client_name?: string;
  account_number?: string;
  tax_rate: number;
  sales_rep_name: string;
  sales_rep_note: string;
  additional_lead_time: number;
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
        additionalPhone: client.additional_phone,
        email: client.email,
        billingEmail: client.billing_email,
        otherEmail: client.other_email || [],
        address: {
          street: client.street,
          city: client.city,
          state: client.state,
          zipCode: client.zip_code,
          country: client.country,
        },
        billingAddress: {
          street: client.billing_street,
          city: client.billing_city,
          state: client.billing_state,
          zipCode: client.billing_zip_code,
          country: client.billing_country,
        },
        clinicRegistrationNumber: client.clinic_registration_number,
        taxRate: client.tax_rate ? Number(client.tax_rate) : undefined,
        salesRepName: client.sales_rep_name,
        additionalLeadTime: client.additional_lead_time
          ? Number(client.additional_lead_time)
          : undefined,
        salesRepNote: client.sales_rep_note,
        notes: client.notes || "",
        doctors: doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          phone: doctor.phone,
          email: doctor.email,
          notes: doctor.notes || "",
          order: doctor.order,
        })),
        created_at: client.created_at,
        updated_at: client.updated_at,
        status: client.status,
      };

      return transformedClient;
    } catch (error) {
      logger.error("Error transforming client from DB", {
        error,
        clientId: client?.id,
      });
      throw error;
    }
  }

  private transformClientToDB(client: ClientInput) {
    return {
      account_number: client?.account_number || client?.accountNumber,
      client_name: client.clientName,
      contact_name: client.contactName,
      phone: client.phone,
      additional_phone: client.additionalPhone,
      email: client.email,
      billing_email: client.billingEmail,
      other_email: client.otherEmail || [],
      street: client.address.street,
      city: client.address.city,
      state: client.address.state,
      zip_code: client.address.zipCode,
      country: client.address.country,
      billing_street: client.billingAddress.street,
      billing_city: client.billingAddress.city,
      billing_state: client.billingAddress.state,
      billing_zip_code: client.billingAddress.zipCode,
      billing_country: client.billingAddress.country,
      clinic_registration_number: client.clinicRegistrationNumber,
      tax_rate: client.taxRate,
      sales_rep_name: client.salesRepName,
      additional_lead_time: client.additionalLeadTime?.toString(),
      sales_rep_note: client.salesRepNote,
      notes: client.notes || "",
      lab_id: client.lab_id,
      status: client.status,
    };
  }

  private transformDoctorToDB(doctor: Omit<Doctor, "id">) {
    return {
      name: doctor.name,
      phone: doctor.phone,
      email: doctor.email,
      notes: doctor.notes,
      order: doctor.order,
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
      console.log(authUser, "authUser");

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
      console.log(uthenicated.role, "uthenicated role");
      if (!userRoleData || !uthenicated.role) {
        logger.error("User role not found in the database", {
          userId: authUser.id,
        });
        throw new Error("User role not found");
      }

      const userRole: any = userRoleData;

      if (!["admin", "technician", "super_admin"].includes(userRole.role)) {
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
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
        .order("updated_at", { ascending: false });

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

      console.log("DEBUG: Raw client query result:", { client, error, id });

      if (error) {
        logger.error("Error fetching client from database", { id, error });
        throw new Error(`Error fetching client: ${error.message}`);
      }

      if (!client) {
        logger.warn("No client found with id", { id });
        return null;
      }

      const typedClient = client as unknown as ClientType;
      console.log(client, "clientclient");
      logger.info("Raw client data from DB", {
        client: typedClient,
        hasData: !!typedClient,
        fields: typedClient ? Object.keys(typedClient) : [],
        id: typedClient.id,
        accountNumber: typedClient.account_number,
        clientName: typedClient.client_name,
        tax_rate: typedClient.tax_rate,
        sales_rep_name: typedClient.sales_rep_name,
        sales_rep_note: typedClient.sales_rep_note,
        additional_lead_time: typedClient.additional_lead_time,
      });

      const { data: doctors, error: doctorsError } = await supabase
        .from("doctors")
        .select("*")
        .eq("client_id", id);

      console.log("DEBUG: Raw doctors query result:", {
        doctors,
        doctorsError,
      });

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
      console.log("DEBUG: Transformed client:", transformedClient);

      return transformedClient;
    } catch (error) {
      logger.error("Error in getClientById", { id, error });
      throw error;
    }
  }

  async addClient(clientData: ClientInput): Promise<Client> {
    try {
      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          ...this.transformClientToDB(clientData),
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
            (d) => `${d.name}|${d.email}|${d.phone}|${d.notes}|${d.order}`
          )
        );
        const newDoctorsSet = new Set(
          clientData.doctors.map(
            (d) => `${d.name}|${d.email}|${d.phone}|${d.notes}|${d.order}`
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

  async deleteClient(id: string): Promise<void> {
    try {
      // Archive related records in cases
      const { error: archiveCasesError } = await supabase
        .from("cases")
        .update({ is_archive: true })
        .eq("client_id", id);

      if (archiveCasesError) throw archiveCasesError;

      // Archive related records in special_service_prices
      const { error: archivePricesError } = await supabase
        .from("special_service_prices")
        .update({ is_archive: true })
        .eq("client_id", id);

      if (archivePricesError) throw archivePricesError;

      // Archive the client
      const { error } = await supabase
        .from("clients")
        .update({ is_archive: true })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      logger.error("Error archiving client", { id, error });
      throw error;
    }
  }
}

export const clientsService = new ClientsService();
