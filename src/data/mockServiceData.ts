export interface Service {
  id: string;
  name: string;
  price: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  categories: string[];
}

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Custom Shade Matching',
    price: 75.00,
    isClientVisible: true,
    isTaxable: true,
    categories: ['Zirconia', 'E.Max', 'PFM'],
  },
  {
    id: '2',
    name: 'Rush Service',
    price: 99.99,
    isClientVisible: true,
    isTaxable: true,
    categories: ['Acrylic', 'Denture', 'E.Max', 'Full Cast', 'Implants', 'PFM', 'Zirconia'],
  },
];