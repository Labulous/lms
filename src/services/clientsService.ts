import { supabase } from '../config/supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger({ module: 'ClientsService' });

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
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientInput extends Omit<Client, 'id' | 'accountNumber' | 'doctors' | 'createdAt' | 'updatedAt'> {
  doctors?: Omit<Doctor, 'id'>[];
}

class ClientsService {
  private async generateAccountNumber(): Promise<string> {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const nextNumber = (count ?? 0) + 1;
    return `24${String(nextNumber).padStart(4, '0')}`;
  }

  private transformClientFromDB(client: any, doctors: any[] = []): Client {
    try {
      logger.info('Transforming client from DB', { 
        clientId: client.id,
        hasClient: !!client,
        hasDoctors: !!doctors,
        doctorsCount: doctors?.length 
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
        doctors: doctors?.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          phone: doctor.phone,
          email: doctor.email,
          notes: doctor.notes,
        })) || [],
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      };

      logger.info('Client transformed successfully', { 
        clientId: transformedClient.id,
        hasAddress: !!transformedClient.address,
        doctorsCount: transformedClient.doctors.length 
      });

      return transformedClient;
    } catch (error) {
      logger.error('Error transforming client from DB', { 
        error,
        clientId: client?.id,
        clientData: client,
        doctorsData: doctors
      });
      throw new Error('Failed to transform client data');
    }
  }

  private transformClientToDB(client: ClientInput) {
    return {
      client_name: client.clientName,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      street: client.address.street,
      city: client.address.city,
      state: client.address.state,
      zip_code: client.address.zipCode,
      clinic_registration_number: client.clinicRegistrationNumber,
      notes: client.notes,
    };
  }

  private transformDoctorToDB(doctor: Omit<Doctor, 'id'>) {
    return {
      name: doctor.name,
      phone: doctor.phone,
      email: doctor.email,
      notes: doctor.notes,
    };
  }

  async getClients(): Promise<Client[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientsWithDoctors = await Promise.all(
        clients.map(async (client) => {
          const { data: doctors, error: doctorsError } = await supabase
            .from('doctors')
            .select('*')
            .eq('client_id', client.id);

          if (doctorsError) {
            logger.error('Error fetching doctors for client', {
              clientId: client.id,
              error: doctorsError,
            });
            return this.transformClientFromDB(client, []);
          }

          return this.transformClientFromDB(client, doctors);
        })
      );

      return clientsWithDoctors;
    } catch (error) {
      logger.error('Error fetching clients', { error });
      throw error;
    }
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      logger.info('Fetching client details', { id });
      
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      console.log('DEBUG: Raw client query result:', { client, error });

      if (error) {
        logger.error('Error fetching client from database', { id, error });
        throw error;
      }
      
      if (!client) {
        logger.warn('No client found with id', { id });
        return null;
      }

      logger.info('Raw client data from DB', { 
        client,
        hasData: !!client,
        fields: client ? Object.keys(client) : [],
        id: client?.id,
        accountNumber: client?.account_number,
        clientName: client?.client_name
      });

      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .eq('client_id', id);

      console.log('DEBUG: Raw doctors query result:', { doctors, doctorsError });

      if (doctorsError) {
        logger.error('Error fetching doctors for client', {
          clientId: id,
          error: doctorsError,
        });
        return this.transformClientFromDB(client, []);
      }

      const transformedClient = this.transformClientFromDB(client, doctors || []);
      console.log('DEBUG: Transformed client:', transformedClient);

      return transformedClient;
    } catch (error) {
      logger.error('Error in getClientById', { id, error });
      throw error;
    }
  }

  async addClient(clientData: ClientInput): Promise<Client> {
    const accountNumber = await this.generateAccountNumber();

    try {
      // Start a Supabase transaction
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          ...this.transformClientToDB(clientData),
          account_number: accountNumber,
        })
        .select()
        .single();

      if (error) throw error;

      // Add doctors if provided
      if (clientData.doctors && clientData.doctors.length > 0) {
        const { error: doctorsError } = await supabase
          .from('doctors')
          .insert(
            clientData.doctors.map(doctor => ({
              ...this.transformDoctorToDB(doctor),
              client_id: client.id,
            }))
          );

        if (doctorsError) throw doctorsError;
      }

      return this.getClientById(client.id) as Promise<Client>;
    } catch (error) {
      logger.error('Error adding client', { error });
      throw error;
    }
  }

  async updateClient(id: string, clientData: ClientInput): Promise<Client> {
    try {
      // Update client
      const { error: clientError } = await supabase
        .from('clients')
        .update(this.transformClientToDB(clientData))
        .eq('id', id);

      if (clientError) throw clientError;

      // Update doctors
      if (clientData.doctors) {
        // Delete existing doctors
        const { error: deleteError } = await supabase
          .from('doctors')
          .delete()
          .eq('client_id', id);

        if (deleteError) throw deleteError;

        // Add new doctors
        if (clientData.doctors.length > 0) {
          const { error: doctorsError } = await supabase
            .from('doctors')
            .insert(
              clientData.doctors.map(doctor => ({
                ...this.transformDoctorToDB(doctor),
                client_id: id,
              }))
            );

          if (doctorsError) throw doctorsError;
        }
      }

      const updatedClient = await this.getClientById(id);
      if (!updatedClient) throw new Error('Failed to fetch updated client');

      return updatedClient;
    } catch (error) {
      logger.error('Error updating client', { id, error });
      throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting client', { id, error });
      throw error;
    }
  }
}

export const clientsService = new ClientsService();
