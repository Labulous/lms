/**
 * Basic JSON type used throughout the application
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Product related enums
 */
export enum ProductCategory {
  Crown = 'crown',
  Bridge = 'bridge',
  Veneer = 'veneer',
  Implant = 'implant',
  Other = 'other'
}

export enum BillingType {
  PerUnit = 'per_unit',
  PerTooth = 'per_tooth',
  Fixed = 'fixed'
}

/**
 * Case status types
 */
export type CaseStatus = 'in_queue' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Shade data structure for dental products
 */
export interface ShadeData {
  occlusal: string
  body: string
  gingival: string
  stump?: string
}

/**
 * Product type definition
 */
export interface Product {
  id: string
  name: string
  description: string
  price: number
  leadTime: number
  isClientVisible: boolean
  isTaxable: boolean
  billingType: BillingType
  category: ProductCategory
  requiresShade: boolean
  material: string
  type: string
}

/**
 * Main database type definitions
 */
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
          status: CaseStatus
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
          status?: CaseStatus
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
          status?: CaseStatus
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
          shade_data: ShadeData
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_product_id: string
          tooth_number: number
          is_range?: boolean
          shade_data?: ShadeData
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_product_id?: string
          tooth_number?: number
          is_range?: boolean
          shade_data?: ShadeData
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type aliases for common database types
export type Case = Database['public']['Tables']['cases']['Row']
export type CaseProduct = Database['public']['Tables']['case_products']['Row']
export type CaseProductTooth = Database['public']['Tables']['case_product_teeth']['Row']