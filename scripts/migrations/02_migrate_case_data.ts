import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

interface OldCase {
  caseId: string;
  clientId: string;
  doctorId?: string;
  patientName: string;
  startDate: string;
  status: string;
  deliveryMethod: string;
  dueDate?: string;
  isDueDateTBD?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  enclosedItems?: Record<string, number>;
  otherItems?: string;
  notes?: {
    labNotes?: string;
    technicianNotes?: string;
  };
  labId: string;
  stages?: Array<{
    name: string;
    status: string;
  }>;
  assignedTechnicians?: string[];
  products?: Array<{
    id: string;
    quantity?: number;
    price: number;
    teeth?: number[];
    shadeData?: Record<string, string | null>;
  }>;
}

interface MigrationStats {
  totalCases: number;
  successfulCases: number;
  failedCases: number;
  errors: Array<{ caseId: string; error: string }>;
}

interface TransformedCase {
  case_id: string;
  client_id: string;
  doctor_id?: string;
  patient_first_name: string;
  patient_last_name: string;
  order_date: string;
  status: string;
  delivery_method: string;
  due_date?: string;
  is_due_date_tbd: boolean;
  appointment_date?: string;
  appointment_time?: string;
  working_pan_name?: string;
  working_pan_color?: string;
  enclosed_items: Record<string, number>;
  other_items?: string;
  lab_notes?: string;
  technician_notes?: string;
  lab_id: string;
}

async function loadExistingCases(): Promise<OldCase[]> {
  try {
    // First try to load from mockCasesData
    const mockDataPath = path.join(process.cwd(), 'src', 'data', 'mockCasesData.ts');
    if (fs.existsSync(mockDataPath)) {
      const mockData = require(mockDataPath);
      return mockData.mockCases || [];
    }

    // If mock data doesn't exist, try loading from a JSON file
    const jsonDataPath = path.join(process.cwd(), 'data', 'cases.json');
    if (fs.existsSync(jsonDataPath)) {
      const jsonData = fs.readFileSync(jsonDataPath, 'utf8');
      return JSON.parse(jsonData);
    }

    console.warn('No existing case data found');
    return [];
  } catch (error) {
    console.error('Error loading existing cases:', error);
    throw error;
  }
}

async function transformCase(oldCase: OldCase): Promise<TransformedCase> {
  // Split patient name into first and last name
  const [firstName = '', lastName = ''] = (oldCase.patientName || '').split(' ');

  // Transform the case data
  const transformedCase: TransformedCase = {
    case_id: oldCase.caseId,
    client_id: oldCase.clientId,
    doctor_id: oldCase.doctorId,
    patient_first_name: firstName,
    patient_last_name: lastName,
    order_date: oldCase.startDate,
    status: oldCase.status,
    delivery_method: oldCase.deliveryMethod,
    due_date: oldCase.dueDate,
    is_due_date_tbd: oldCase.isDueDateTBD || false,
    appointment_date: oldCase.appointmentDate,
    appointment_time: oldCase.appointmentTime,
    enclosed_items: oldCase.enclosedItems || {
      impression: 0,
      biteRegistration: 0,
      photos: 0,
      jig: 0,
      opposingModel: 0,
      articulator: 0,
      returnArticulator: 0,
      cadcamFiles: 0,
      consultRequested: 0
    },
    other_items: oldCase.otherItems,
    lab_notes: oldCase.notes?.labNotes,
    technician_notes: oldCase.notes?.technicianNotes,
    lab_id: oldCase.labId
  };

  return transformedCase;
}

async function migrateCase(oldCase: OldCase): Promise<void> {
  try {
    // Transform the case data
    const transformedCase = await transformCase(oldCase);

    // Insert the main case
    const { data: insertedCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        id: oldCase.caseId,
        patient_name: oldCase.patientName,
        case_number: oldCase.caseId,
        created_at: oldCase.startDate,
        updated_at: oldCase.startDate,
        status: oldCase.status,
        client_id: oldCase.clientId,
        doctor_id: oldCase.doctorId,
        qr_code: oldCase.doctorId,
      })
      .select('id')
      .single();

    if (caseError) throw caseError;
    if (!insertedCase) throw new Error('No case data returned after insert');

    // Migrate case stages
    if (oldCase.stages && oldCase.stages.length > 0) {
      const { error: stagesError } = await supabase
        .from('case_stages')
        .insert(
          oldCase.stages.map(stage => ({
            case_id: insertedCase.id,
            name: stage.name,
            status: stage.status
          }))
        );
      
      if (stagesError) throw stagesError;
    }

    // Migrate technician assignments
    if (oldCase.assignedTechnicians && oldCase.assignedTechnicians.length > 0) {
      const { error: techniciansError } = await supabase
        .from('case_technicians')
        .insert(
          oldCase.assignedTechnicians.map(techId => ({
            case_id: insertedCase.id,
            technician_id: techId
          }))
        );
      
      if (techniciansError) throw techniciansError;
    }

    // Migrate products and tooth selections
    if (oldCase.products && oldCase.products.length > 0) {
      for (const product of oldCase.products) {
        // Insert case product
        const { data: insertedProduct, error: productError } = await supabase
          .from('case_products')
          .insert({
            case_id: insertedCase.id,
            product_id: product.id,
            quantity: product.quantity || 1,
            unit_price: product.price
          })
          .select('id')
          .single();

        if (productError) throw productError;
        if (!insertedProduct) throw new Error('No product data returned after insert');

        // Insert tooth selections if any
        if (product.teeth && product.teeth.length > 0) {
          const { error: teethError } = await supabase
            .from('case_product_teeth')
            .insert(
              product.teeth.map(tooth => ({
                case_product_id: insertedProduct.id,
                tooth_number: tooth,
                is_range: false,
                shade_data: product.shadeData || null
              }))
            );

          if (teethError) throw teethError;
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

async function migrateCaseData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalCases: 0,
    successfulCases: 0,
    failedCases: 0,
    errors: []
  };

  try {
    // Get existing cases
    const existingCases = await loadExistingCases();
    stats.totalCases = existingCases.length;
    
    console.log(`Starting migration of ${stats.totalCases} cases`);

    // Process each case
    for (const oldCase of existingCases) {
      try {
        await migrateCase(oldCase);
        stats.successfulCases++;
        console.log(`Successfully migrated case ${oldCase.caseId}`);
      } catch (error) {
        stats.failedCases++;
        stats.errors.push({
          caseId: oldCase.caseId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to migrate case ${oldCase.caseId}:`, error);
      }
    }

    return stats;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
async function runMigration() {
  try {
    const stats = await migrateCaseData();
    console.log('Migration completed:', {
      totalCases: stats.totalCases,
      successful: stats.successfulCases,
      failed: stats.failedCases
    });

    if (stats.errors.length > 0) {
      console.warn('Failed cases:', stats.errors);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}
