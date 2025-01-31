import { DeliveryMethod } from "@/data/mockCasesData";

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

export interface WorkstationForm {
  created_by: string;
  technician_id: string;
  custom_workstation_type: string;
  status: "in_progress" | "completed" | "issue_reported" | "on_hold";
  started_notes: string;
  started_at: string;
  completed_at: string;
  issue_reported_at: string;
  workstation_type_id: string;
  case_id: string;
}
export interface WorkingTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
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
  is_active?: boolean;
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
export enum MarginDesign {
  NotApplicable = "not_applicable",
  porcelainMargin = "porcelain_margin",
  porcelainToMargin = "porcelain_to_margin",
  fineMetalCollar = "fine_metalCollar",
  ModifiedRidgeLap = "modified_ridge_lap",
  Custom = "custom",
}
export enum OcclusalDesign {
  NotApplicable = "not_applicable",
  porcelainOcclusal = "porcelain_occlusal",
  metalOcculusal = "metal_occlusal",
  metalOcculusal2_3 = "2/3_metal_occlusal",
  Custom = "custom",
}
export enum AlloylDesign {
  NotApplicable = "not_applicable",
  nonPrecious = "non-precious",
  semiPrecious = "semi-precious",
  precious = "precious",
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
export type CaseStatus =
  | "in_queue"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export const CASE_STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  in_queue: "Case has been received and is waiting to be assigned",
  in_progress: "Case is currently being worked on by technicians",
  on_hold: "Case work has been temporarily paused",
  completed: "Case has been finished and is ready for delivery",
  cancelled: "Case has been cancelled and will not be processed",
};

/**
 * Shade data structure for dental products
 */
export interface ShadeData {
  occlusal_shade?: string;
  body_shade?: string;
  gingival_shade?: string;
  stump_shade?: string;
  id?: string;
  custom_occlusal?: string;
  custom_gingival?: string;
  custom_stump?: string;
  custom_body?: string;
  manual_occlusal?: string;
  manual_gingival?: string;
  manual_stump?: string;
  manual_body?: string;
  subRow?: {
    occlusal_shade?: string;
    body_shade?: string;
    gingival_shade?: string;
    stump_shade?: string;
    id?: string;
    custom_occlusal?: string;
    custom_gingival?: string;
    custom_stump?: string;
    custom_body?: string;
    manual_occlusal?: string;
    manual_gingival?: string;
    manual_stump?: string;
    manual_body?: string;
  }[];
}

export interface OfficeAddress {
  address_1: string;
  address_2: string;
  city: string;
  state_province?: string;
  zip_postal?: string;
  country?: string;
  phone_number?: string;
}

export interface labDetail {
  name: string;
  id?: string;
  office_address: OfficeAddress; // office_address should be an array of objects
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

export interface PaymentListItem {
  id: string;
  payment_date: string; // ISO 8601 date string
  amount: number;
  payment_method: string;
  status: string;
  over_payment: number;
  remaining_payment: number;
  clients: { client_name: string };
  client_name?: string;
}

export interface BalanceTrackingItem {
  created_at: string;
  client_id: string;
  credit: number;
  client_name: string;
  outstanding_balance: number;
  this_month: number;
  last_month: number;
  days_30_plus: number;
  days_60_plus: number;
  days_90_plus: number;
  total: number;
  lab_id: string;
  id: string;
}

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

interface ProductMaterial {
  name: string;
  is_active: boolean;
  description: string;
}

interface ProductProductType {
  name: string;
  is_active: boolean;
  description: string;
}

interface ProductBillingType {
  name: string;
  label: string;
  is_active: boolean;
  description: string;
}

export interface DiscountedPrice {
  product_id: string;
  discount: number;
  final_price: number;
  price: number;
}
export interface ProductWithShade extends Product {
  shadeData?: ShadeData;
  selectedTeeth?: number[];
}

/**
 * Main database type definitions
 */
export interface WorkingStationLog {
  technician_id: string;
  workstation_type: string;
  status: "in_queue" | "in_progress" | "completed" | "pending";
  notes: string;
  started_at: string;
  completed_at: string | null;
  issue_reported_at: string | null;
  type: { id: string; name: string };
  technician: { name: string; id: string };
}
export interface WorkingStationTypes {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface Shade {
  name: string;
  category: string;
  is_active: boolean;
}

export interface ToothInfo {
  is_range: boolean;
  tooth_number: number[];
  occlusal_shade: Shade;
  body_shade: Shade;
  gingival_shade: Shade;
  stump_shade_id: Shade;
}
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          account_number: string;
          client_name: string;
        };
        Insert: {
          client_name: string;
          contact_name: string;
          phone: string;
          email: string;
          street: string;
          city: string;
          state: string;
          zip_code: string;
          clinic_registration_number: string;
          notes: string;
          account_number: string;
        };
      };
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
      lab: {
        Row: {
          id: string;
          super_admin_id: string;
          admin_ids: string[];
          client_ids: string[];
          technician_ids: string[];
          name: string;
          office_address: {
            address_1: string;
            address_2: string;
            city: string;
            state_province: string;
            zip_postal: string;
            country: string;
            phone_number: string;
            email: string;
          };
        };
        Insert: {
          admin_ids?: string[];
          client_ids?: string[];
          technician_ids?: string[];
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
          product:
            | {
                id: string;
                name: string;
                price: number;
                lead_time: string | null; // Assuming the lead time can be a string or null
                is_client_visible: boolean;
                is_taxable: boolean;
                created_at: string; // ISO date string
                updated_at: string; // ISO date string
                requires_shade: boolean;
                material: ProductMaterial;
                product_type: ProductProductType;
                billing_type: ProductBillingType;
                discounted_price?: DiscountedPrice;
              }[]
            | [];
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
          teethProducts: ToothInfo[];
          product_ids: {
            id: string;
            products_id: string[];
          }[]; // Array of product ids
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
          margin_design: MarginDesign;
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
          margin_design: MarginDesign;
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
          margin_design: MarginDesign;
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
            id?: string;
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
      labs: {
        Row: {
          name: string;
          office_address: {
            address_1: string;
            address_2: string;
            city: string;
            state?: string;
          };
        };
        Insert: {
          name?: string;
          office_address?: {
            address_1?: string;
            address_2?: string;
            city?: string;
            state?: string;
          };
        };
      };
      payments: {
        Row: {
          id: string;
          payment_date: string; // ISO 8601 date string
          amount: number;
          payment_method: string;
          status: string;
          over_payment: number;
          remaining_payment: number;
          clients: { client_name: string };
        };
      };
      Insert: {
        payment_date?: string; // ISO 8601 date string
        amount?: number;
        payment_method?: string;
        status?: string;
        over_payment?: number;
        remaining_payment?: number;
        clients?: { client_name?: string };
      };
    };
    working_tags: {
      row: WorkingTag[];
      insert: {
        name?: string;
        color?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
    workstation_log: {
      row: WorkingStationLog[];
      insert: {
        technician_id?: string;
        workstation_type?: string;
        status?: " in_queue | in_progress" | "completed" | "pending";
        notes?: string;
        started_at?: string;
        completed_at?: string | null;
        issue_reported_at?: string | null;
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
export interface Case {
  id: string;
  created_at: string;
  received_date: string | null;
  ship_date: string | null;
  status: "active" | "completed" | "on_hold";
  patient_name: string;
  due_date: string;
  case_number: string;
  client: {
    id: string;
    client_name: string;
    phone: string | null;
  } | null;
  doctor: {
    id: string;
    name: string;
    client: {
      id: string;
      client_name: string;
      phone: string | null;
    } | null;
  } | null;
}
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
  statusError?: string;
  deliveryMethod: DeliveryMethod;
  deliveryMethodError?: string;
  instructionNotes?: string;
  dueDate?: string;
  isDueDateTBD?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  assignedTechnicians?: string[];
  workingPanName?: string;
  workingTagName?: string;
  workingPanColor?: string;
  is_appointment_TBD: boolean;
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
    occlusalType?: string;
    customOcclusal?: string;
    contactType?: string;
    ponticType?: string;
    customPontic?: string;
    customContact?: string;
    marginDesign?: string;
    customMargin?: string;
    occlusalDesign?: string;
    customOcclusalDesign?: string;
    alloyType?: string;
    customAlloy?: string;
  };
  notes: {
    instructionNotes?: string;
    invoiceNotes?: string;
  };
  itemsError?: string;
}

/**
 * Case related interfaces
 */
export interface CaseFilters {
  dueDate: string;
  status: string;
  searchTerm: string;
}

/**
 * User management interfaces
 */
export interface Users {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  created_at: string;
  updated_at: string;
}
