import { supabase } from "../lib/supabase";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

class PatientsService {
  protected maskEmail(email: string): string {
    let [name, domain] = email.split("@");

    if (name.length <= 6) {
      name = name[0] + "*****" + name[name.length - 1];
    } else {
      name = name.substring(0, 3) + "*****" + name.substring(name.length - 3);
    }

    return name + "@" + domain;
  }

  public async getMaskedEmail(email: string): Promise<string> {
    return this.maskEmail(email);
  }

  private async transformPatientFromDB(patient: any): Promise<Patient> {
    return {
      id: patient.id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: this.maskEmail(patient.email),
      phone: patient.phone,
    };
  }

  async getPatients(searchTerm?: string): Promise<Patient[]> {
    try {
      let query = supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`
        );
      } else {
        query = query.limit(10);
      }

      const { data: patients, error } = await query;

      if (error) {
        throw new Error(`Error fetching client: ${error.message}`);
      }

      if (!patients) {
        return [];
      }

      const modifiedPatients = await Promise.all(
        patients.map(async (patient: any) => {
          return this.transformPatientFromDB(patient);
        })
      );

      return modifiedPatients;
    } catch (error) {
      throw error;
    }
  }

  async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) {
        throw new Error(`Error fetching client: ${error.message}`);
      }

      if (!patient) {
        return null;
      }

      return this.transformPatientFromDB(patient);
    } catch (error) {
      throw error;
    }
  }
}

export const patientsService = new PatientsService();
