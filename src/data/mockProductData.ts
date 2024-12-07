export interface Product {
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

export type BillingType = 'perTooth' | 'perArch' | 'teeth' | 'generic' | 'calculate' | 'per_unit';

export type MaterialType = 'Acrylic' | 'Denture' | 'E.Max' | 'Full Cast' | 'PFM' | 'Zirconia';

export type ProductType = 'Crown' | 'Bridge' | 'Removable' | 'Implant' | 'Coping' | 'Appliance';

export const BILLING_TYPES = [
  { value: 'perTooth', label: 'Per Tooth', description: 'Price calculated per tooth (e.g., crowns and bridges)' },
  { value: 'perArch', label: 'Per Arch', description: 'Price calculated per dental arch' },
  { value: 'teeth', label: 'Teeth', description: 'Selection without charging per tooth' },
  { value: 'generic', label: 'Generic', description: 'No specific teeth selection required' },
  { value: 'calculate', label: 'Calculate', description: 'Price calculation based on entered amount' },
  { value: 'per_unit', label: 'Per Unit', description: 'Price calculated per unit' },
];

export const MATERIALS: MaterialType[] = [
  'Acrylic',
  'Denture',
  'E.Max',
  'Full Cast',
  'PFM',
  'Zirconia',
];

export const PRODUCT_TYPES: ProductType[] = [
  'Crown',
  'Bridge',
  'Removable',
  'Implant',
  'Coping',
  'Appliance'
];

export const VITA_CLASSICAL_SHADES = [
  'A1', 'A2', 'A2.5', 'A3', 'A3.5', 'A4',
  'B1', 'B1.5', 'B2', 'B3', 'B4',
  'C1', 'C1.5', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4'
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'PFM Crown',
    description: 'Porcelain Fused to Metal Crown',
    price: 299.99,
    leadTime: 5,
    isClientVisible: true,
    isTaxable: true,
    requiresShade: true,
    type: ['Crown'],
    billingType: 'per_unit',
    material: 'PFM'
  },
  {
    id: '2',
    name: 'Full Denture',
    description: 'Full Denture',
    price: 899.99,
    leadTime: 7,
    isClientVisible: true,
    isTaxable: true,
    requiresShade: false,
    type: ['Removable'],
    billingType: 'perArch',
    material: 'Denture'
  },
];