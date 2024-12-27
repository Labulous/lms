export interface Service {
  id: string;
  name: string;
  price: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  categories: string[];
  discount?: number;
}

export const mockServices: Service[] = [
  {
    id: "1",
    name: "Custom Shade Matching",
    price: 75.0,
    isClientVisible: true,
    isTaxable: true,
    categories: ["Zirconia", "E.Max", "PFM"],
    discount: 0,
  },
  {
    id: "2",
    name: "Rush Service",
    price: 99.99,
    isClientVisible: true,
    isTaxable: true,
    discount: 0,
    categories: [
      "Acrylic",
      "Denture",
      "E.Max",
      "Full Cast",
      "Implants",
      "PFM",
      "Zirconia",
    ],
  },
];
