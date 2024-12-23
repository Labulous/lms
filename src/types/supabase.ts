/**
 * Basic JSON type used throughout the application
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Default product types enum
 */
export enum DefaultProductType {
  Crown = "Crown",
  Bridge = "Bridge",
  Removable = "Removable",
  Implant = "Implant",
  Coping = "Coping",
  Appliance = "Appliance",
}

/**
 * Reference data interfaces
 */
export interface Material {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default?: boolean; // true for DefaultProductType entries
  created_at: string;
  updated_at: string;
}

export interface BillingType {
  id: string;
  name: string;
  label: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShadeOption {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Product related enums
 */
export enum MaterialType {
  Acrylic = "Acrylic",
  Denture = "Denture",
  E_Max = "E.Max",
  Full_Cast = "Full Cast",
  PFM = "PFM",
  Zirconia = "Zirconia",
}

export enum BillingType {
  PerTooth = "perTooth",
  PerArch = "perArch",
  Teeth = "teeth",
  Generic = "generic",
  Calculate = "calculate",
  PerUnit = "per_unit",
}

export const BILLING_TYPE_LABELS = {
  [BillingType.PerTooth]: {
    label: "Per Tooth",
    description: "Price calculated per tooth (e.g., crowns and bridges)",
  },
  [BillingType.PerArch]: {
    label: "Per Arch",
    description: "Price calculated per dental arch",
  },
  [BillingType.Teeth]: {
    label: "Teeth",
    description: "Selection without charging per tooth",
  },
  [BillingType.Generic]: {
    label: "Generic",
    description: "No specific teeth selection required",
  },
  [BillingType.Calculate]: {
    label: "Calculate",
    description: "Price calculation based on entered amount",
  },
  [BillingType.PerUnit]: {
    label: "Per Unit",
    description: "Price calculated per unit",
  },
} as const;

export enum PonticType {
  NotApplicable = "not_applicable",
  WashThrough = "wash_through",
  Dome = "dome",
  ModifiedRidgeLap = "modified_ridge_lap",
  RidgeLap = "ridge_lap",
  Ovate = "ovate",
  Custom = "custom",
}

export enum OcclusalType {
  NotApplicable = "not_applicable",
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
  Custom = "custom",
}

export enum ContactType {
  NotApplicable = "not_applicable",
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
  Custom = "custom",
}

/**
 * Case status types
 */
export type CaseStatus = "in_queue" | "in_progress" | "completed" | "cancelled";

/**
 * Shade data structure for dental products
 */
export interface ShadeData {
  occlusal_shade_id?: string; // UUID reference to shade_options
  body_shade_id?: string; // UUID reference to shade_options
  gingival_shade_id?: string; // UUID reference to shade_options
  stump_shade_id?: string; // UUID reference to shade_options
}

/**
 * Shade data with resolved names for display
 */
export interface ShadeDataDisplay {
  occlusal?: string;
  body?: string;
  gingival?: string;
  stump?: string;
}

/**
 * Product type definition
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  leadTime: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billing_type_id: string; // UUID reference to billing_types table
  requiresShade: boolean;
  material_id: string; // UUID reference to materials table
  product_type_id: string; // UUID reference to product_types table
  created_at?: string;
  updated_at?: string;
}

export interface ProductWithShade extends Product {
  shadeData?: ShadeData;
  selectedTeeth?: number[];
}

/**
 * Main database type definitions
 */
export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          created_by: string;
          client_id: string;
          doctor_id: string | null;
          patient_name: string;
          rx_number: string;
          due_date: string;
          qr_code: string;
          status: CaseStatus;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          client_id: string;
          doctor_id?: string | null;
          patient_name: string;
          rx_number: string;
          due_date: string;
          qr_code?: string;
          status?: CaseStatus;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          client_id?: string;
          doctor_id?: string | null;
          patient_name?: string;
          rx_number?: string;
          due_date?: string;
          qr_code?: string;
          status?: CaseStatus;
          notes?: string | null;
        };
      };
      case_products: {
        Row: {
          id: string;
          case_id: string;
          product_id: string;
          quantity: number;
          notes: string | null;
          occlusal_type: OcclusalType;
          custom_occlusal_details: string | null;
          contact_type: ContactType;
          custom_contact_details: string | null;
          pontic_type: PonticType;
          custom_pontic_details: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          product_id: string;
          quantity?: number;
          notes?: string | null;
          occlusal_type?: OcclusalType;
          custom_occlusal_details?: string | null;
          contact_type?: ContactType;
          custom_contact_details?: string | null;
          pontic_type?: PonticType;
          custom_pontic_details?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          product_id?: string;
          quantity?: number;
          notes?: string | null;
          occlusal_type?: OcclusalType;
          custom_occlusal_details?: string | null;
          contact_type?: ContactType;
          custom_contact_details?: string | null;
          pontic_type?: PonticType;
          custom_pontic_details?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      case_product_teeth: {
        Row: {
          id: string;
          case_product_id: string;
          tooth_number: number;
          is_range: boolean;
          shade_data: ShadeData;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_product_id: string;
          tooth_number: number;
          is_range?: boolean;
          shade_data?: ShadeData;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_product_id?: string;
          tooth_number?: number;
          is_range?: boolean;
          shade_data?: ShadeData;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: Material;
        Insert: Omit<Material, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Material, "id">> & {
          id?: string;
        };
      };
      product_types: {
        Row: ProductType;
        Insert: Omit<ProductType, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProductType, "id">> & {
          id?: string;
        };
      };
      billing_types: {
        Row: BillingType;
        Insert: Omit<BillingType, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BillingType, "id">> & {
          id?: string;
        };
      };
      shade_options: {
        Row: ShadeOption;
        Insert: Omit<ShadeOption, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ShadeOption, "id">> & {
          id?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          lead_time: number;
          is_client_visible: boolean;
          is_taxable: boolean;
          billing_type_id: string;
          requires_shade: boolean;
          material_id: string;
          product_type_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          lead_time: number;
          is_client_visible?: boolean;
          is_taxable?: boolean;
          billing_type_id: string;
          requires_shade?: boolean;
          material_id: string;
          product_type_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          lead_time?: number;
          is_client_visible?: boolean;
          is_taxable?: boolean;
          billing_type_id?: string;
          requires_shade?: boolean;
          material_id?: string;
          product_type_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Type aliases for common database types
export type Case = Database["public"]["Tables"]["cases"]["Row"] & {
  client_name?: string;
  doctor_name?: string;
};
export type CaseProduct = Database["public"]["Tables"]["case_products"]["Row"];
export type CaseProductTooth =
  Database["public"]["Tables"]["case_product_teeth"]["Row"];
