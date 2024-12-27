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

export interface BillingTypes {
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
  occlusal?: string; // UUID reference to shade_options
  body?: string; // UUID reference to shade_options
  gingival?: string; // UUID reference to shade_options
  stump?: string; // UUID reference to shade_options
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

interface Product {
  id: string;
  name: string;
  price: number;
  lead_time: number | null;
  is_client_visible: boolean;
  is_taxable: boolean;
  created_at: string;
  updated_at: string;
  requires_shade: boolean;
  material_id: string;
  product_type_id: string;
  billing_type_id: string;
  material: {
    name: string;
  };
  product_type: {
    name: string;
  };
  billing_type: {
    name: string;
    label: string;
  };
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
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: "admin" | "technician" | "client";
        };
        Insert: {
          name: string | null;
          email: string | null;
          role: "client" | "technician";
        };
      };
      cases: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string; // Assuming this is available in your query
          created_by?: string; // Assuming this is available in your query
          client_id: string;
          doctor_id: string | null;
          patient_name: string;
          rx_number: string;
          due_date: string;
          qr_code: string; // Assuming this is part of your query (if not, remove this)
          status: string; // Assuming 'CaseStatus' is a valid enum
          notes: string | null;
          client: {
            id: string;
            client_name: string;
            phone: string;
          };
          doctor: {
            id: string;
            name: string;
            client: {
              id: string;
              client_name: string;
              phone: string;
            };
          };
          enclosed_items: {
            jig: number;
            photos: number;
            user_id: string;
            impression: number;
            articulator: number;
            cadcamFiles: number;
            opposingModel: number;
            biteRegistration: number;
            consultRequested: number;
            returnArticulator: number;
          };
          product_ids: string[]; // Array of product ids
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
        Row: {
          id: string;
          name: string;
          label: string;
        };
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
          discount: number;
          id: string;
          name: string;
          description: string; // Added description as it was missing
          price: number;
          lead_time: number;
          is_client_visible: boolean;
          is_taxable: boolean;
          created_at: string;
          updated_at: string;
          requires_shade: boolean;
          material_id: string;
          product_type_id: string;
          billing_type_id: string;
          material: {
            name: string;
          } | null; // Adding the full object for material
          product_type: {
            name: string;
          } | null; // Adding the full object for product_type
          billing_type: {
            name: string;
            label: string | null;
          } | null; // Adding the full object for billing_type
        };
        Insert: {
          id?: string;
          name?: string;
          description?: string; // Added description as it was missing
          price?: number;
          lead_time?: number;
          is_client_visible?: boolean;
          is_taxable?: boolean;
          created_at?: string;
          updated_at?: string;
          requires_shade?: boolean;
          material_id?: string;
          product_type_id?: string;
          billing_type_id?: string;
          material?: {
            name: string;
          } | null; // Adding the full object for material
          product_type?: {
            name: string;
          } | null; // Adding the full object for product_type
          billing_type?: {
            name: string;
            label: string | null;
          };
        };
        Update: {
          id?: string;
          name?: string;
          description?: string; // Added description as it was missing
          price?: number;
          lead_time?: number;
          is_client_visible?: boolean;
          is_taxable?: boolean;
          requires_shade?: boolean;
          material_id?: string;
          product_type_id?: string;
          billing_type_id?: string;
        };
      };
    };
    headers: {
      Accept: string;
      "Content-Type": string;
      "Accept-Profile": string;
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

export interface FormData {
  clientId: string;
  doctorId: string;
  patientFirstName: string;
  patientLastName: string;
  orderDate: string;
  status: CaseStatus;
  deliveryMethod: string;
  dueDate?: string;
  isDueDateTBD?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  enclosedItems: {
    impression: number;
    biteRegistration: number;
    photos: number;
    jig: number;
    opposingModel: number;
    articulator: number;
    returnArticulator: number;
    cadcamFiles: number;
    consultRequested: number;
  };
  otherItems?: string;
  clientName?: string;
  caseDetails?: {
    occlusalType: string;
    customOcclusal?: string;
    contactType: string;
    ponticType: string;
    customPontic?: string;
    customContact: string;
  };
  notes?: {
    labNotes?: string;
    technicianNotes?: string;
  };
}
