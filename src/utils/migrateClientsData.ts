import { supabase } from '../lib/supabase';
import { mockClients } from '../data/mockClientsData';
import { createLogger } from './logger';

const logger = createLogger({ module: 'MigrateClientsData' });

export async function migrateClientsData() {
  try {
    logger.info('Starting clients data migration');
    let successCount = 0;
    let errorCount = 0;

    for (const client of mockClients) {
      try {
        // Insert client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            account_number: client.accountNumber,
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
          })
          .select()
          .single();

        if (clientError) throw clientError;

        // Insert doctors
        if (client.doctors.length > 0) {
          const { error: doctorsError } = await supabase
            .from('doctors')
            .insert(
              client.doctors.map(doctor => ({
                client_id: newClient.id,
                name: doctor.name,
                phone: doctor.phone,
                email: doctor.email,
                notes: doctor.notes,
              }))
            );

          if (doctorsError) throw doctorsError;
        }

        successCount++;
        logger.info('Successfully migrated client', {
          clientName: client.clientName,
          accountNumber: client.accountNumber,
        });
      } catch (error) {
        errorCount++;
        logger.error('Error migrating client', {
          clientName: client.clientName,
          accountNumber: client.accountNumber,
          error,
        });
      }
    }

    logger.info('Migration completed', {
      total: mockClients.length,
      success: successCount,
      error: errorCount,
    });

    return {
      success: successCount,
      error: errorCount,
      total: mockClients.length,
    };
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  }
}
