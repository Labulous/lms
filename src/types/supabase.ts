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
          patient_birth_date: string
          rx_number: string
          due_date: string
          qr_code: string
          status: 'in_queue' | 'in_progress'
          billing_type: 'insurance' | 'cash' | 'warranty'
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
          patient_birth_date: string
          rx_number: string
          due_date: string
          qr_code?: string
          status?: 'in_queue' | 'in_progress'
          billing_type: 'insurance' | 'cash' | 'warranty'
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
          patient_birth_date?: string
          rx_number?: string
          due_date?: string
          qr_code?: string
          status?: 'in_queue' | 'in_progress'
          billing_type?: 'insurance' | 'cash' | 'warranty'
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
