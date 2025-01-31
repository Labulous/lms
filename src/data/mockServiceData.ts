export interface Service {
  id?: string;
  name: string;
  price: number;
  is_client_visible: boolean;
  is_taxable: boolean;
  discount?: number;
  description?: string;
  material?: {
    name: string;
  };
  material_id?: string;
}

export const mockServices: Service[] = [
  {
    id: "1",
    name: "Custom Shade Matching",
    price: 75.0,
    is_client_visible: true,
    is_taxable: true,
    discount: 0,
  },
  {
    id: "2",
    name: "Rush Service",
    price: 99.99,
    is_client_visible: true,
    is_taxable: true,
    discount: 0,
  },
];
