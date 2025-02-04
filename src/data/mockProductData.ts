import { ShadeData } from "@/types/supabase";

export interface ProductShades {
  occlusal: string;
  body: string;
  gingival: string;
  stump: string;
  customOcclusal?: string;
  customBody?: string;
  customStump?: string;
  customGingical?: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  type: string;
  teeth: number[];
  price: number;
  shades: ShadeData;
  discount: number;
  notes: string;
  additional_service_id: string;
  quantity?: number;
  subRows?: SavedProduct[];
  pontic_teeth?: number[];
  is_taxable: boolean;
}

export interface Product {
  category: unknown;
  id: string;
  name: string;
  description: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  requiresShade?: boolean;
  type: ProductType[];
  billingType: BillingType;
  material: MaterialType;
}

export type BillingType =
  | "perTooth"
  | "perArch"
  | "teeth"
  | "generic"
  | "calculate"
  | "per_unit";

export type MaterialType =
  | "Acrylic"
  | "Denture"
  | "E.Max"
  | "Full Cast"
  | "PFM"
  | "Zirconia";

export type ProductType =
  | "Crown"
  | "Bridge"
  | "Removable"
  | "Implant"
  | "Coping"
  | "Appliance"
  | "Service";

export const BILLING_TYPES = [
  {
    value: "perTooth",
    label: "Per Tooth",
    description: "Price calculated per tooth (e.g., crowns and bridges)",
  },
  {
    value: "perArch",
    label: "Per Arch",
    description: "Price calculated per dental arch",
  },
  {
    value: "teeth",
    label: "Teeth",
    description: "Selection without charging per tooth",
  },
  {
    value: "generic",
    label: "Generic",
    description: "No specific teeth selection required",
  },
  {
    value: "calculate",
    label: "Calculate",
    description: "Price calculation based on entered amount",
  },
  {
    value: "per_unit",
    label: "Per Unit",
    description: "Price calculated per unit",
  },
];

export const MATERIALS: MaterialType[] = [
  "Acrylic",
  "Denture",
  "E.Max",
  "Full Cast",
  "PFM",
  "Zirconia",
];

export const PRODUCT_TYPES: ProductType[] = [
  "Crown",
  "Bridge",
  "Removable",
  "Implant",
  "Coping",
  "Appliance",
  "Service",
];

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "PFM Crown",
    description: "Porcelain Fused to Metal Crown",
    price: 299.99,
    leadTime: 5,
    isClientVisible: true,
    isTaxable: true,
    requiresShade: true,
    type: ["Crown", "Bridge"],
    billingType: "per_unit",
    material: "PFM",
    category: undefined,
  },
  {
    id: "2",
    name: "Full Denture",
    description: "Full Denture",
    price: 899.99,
    leadTime: 7,
    isClientVisible: true,
    isTaxable: true,
    requiresShade: false,
    type: ["Removable"],
    billingType: "perArch",
    material: "Denture",
    category: undefined,
  },
];
