export interface Product {
  id: string;
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billingType: BillingType;
  category: ProductCategory;
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