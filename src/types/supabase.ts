export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          created_by: string
          client_id: string
          doctor_id: string | null
          patient_name: string
          rx_number: string
          due_date: string
          qr_code: string
          status: 'in_queue' | 'in_progress'
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          created_by: string
          client_id: string
          doctor_id?: string | null
          patient_name: string
          rx_number: string
          due_date: string
          qr_code?: string
          status?: 'in_queue' | 'in_progress'
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          client_id?: string
          doctor_id?: string | null
          patient_name?: string
          rx_number?: string
          due_date?: string
          qr_code?: string
          status?: 'in_queue' | 'in_progress'
          notes?: string | null
        }
      }
      case_products: {
        Row: {
          id: string
          case_id: string
          product_id: string
          quantity: number
          notes: string | null
          occlusal_details: string | null
          contact_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          product_id: string
          quantity?: number
          notes?: string | null
          occlusal_details?: string | null
          contact_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          product_id?: string
          quantity?: number
          notes?: string | null
          occlusal_details?: string | null
          contact_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      case_product_teeth: {
        Row: {
          id: string
          case_product_id: string
          tooth_number: number
          is_range: boolean
          shade_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_product_id: string
          tooth_number: number
          is_range?: boolean
          shade_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_product_id?: string
          tooth_number?: number
          is_range?: boolean
          shade_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  leadTime: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billingType: BillingType;
  category: ProductCategory;
  requiresShade: boolean;
  material: string;
  type: string;
}

export interface ShadeData {
  occlusal: string;
  body: string;
  gingival: string;
  stump: string;
  // Remove stump if not needed
}

export interface Case {
  id: string;
  created_at: string;
  received_date: string;
  ship_date: string;
  due_date: string;
  patient_name: string;
  status: string;
  qr_code?: string;
  pan_number?: string;
  rx_number?: string;
  billing_type?: string;
  case_files?: any[]; // Define proper type
}