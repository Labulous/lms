export interface Product {
  id: string;
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billingType: BillingType;
  category: ProductCategory;
  requiresShade?: boolean;
}

export type BillingType = 'perTooth' | 'perArch' | 'teeth' | 'generic' | 'calculate';

export type ProductCategory = 'Acrylic' | 'Denture' | 'E.Max' | 'Full Cast' | 'Implants' | 'PFM' | 'Zirconia' | 'Misc';

export const BILLING_TYPES = [
  { value: 'perTooth', label: 'Per Tooth', description: 'Price calculated per tooth (e.g., crowns and bridges)' },
  { value: 'perArch', label: 'Per Arch', description: 'Price calculated per dental arch' },
  { value: 'teeth', label: 'Teeth', description: 'Selection without charging per tooth' },
  { value: 'generic', label: 'Generic', description: 'No specific teeth selection required' },
  { value: 'calculate', label: 'Calculate', description: 'Price calculation based on entered amount' },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Acrylic',
  'Denture',
  'E.Max',
  'Full Cast',
  'Implants',
  'PFM',
  'Zirconia',
  'Misc',
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
    name: 'Zirconia Crown',
    price: 299.99,
    leadTime: 5,
    isClientVisible: true,
    isTaxable: true,
    billingType: 'perTooth',
    category: 'Zirconia',
    requiresShade: true
  },
  {
    id: '2',
    name: 'Full Denture',
    price: 899.99,
    leadTime: 7,
    isClientVisible: true,
    isTaxable: true,
    billingType: 'perArch',
    category: 'Denture',
  },
];