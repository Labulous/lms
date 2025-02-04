export interface Tax {
  id: string;
  name: string;
  description: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data for development
let mockTaxes: Tax[] = [
  {
    id: "1",
    name: "Standard VAT",
    description: "Standard Value Added Tax",
    rate: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const getTaxes = async (labId: string): Promise<Tax[]> => {
  // TODO: Replace with actual API call
  return mockTaxes;
};

export const createTax = async (
  labId: string,
  tax: Omit<Tax, "id" | "createdAt" | "updatedAt">
): Promise<Tax> => {
  // TODO: Replace with actual API call
  const newTax: Tax = {
    id: Math.random().toString(36).substr(2, 9),
    ...tax,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockTaxes.push(newTax);
  return newTax;
};

export const updateTax = async (
  labId: string,
  id: string,
  tax: Partial<Omit<Tax, "id" | "createdAt" | "updatedAt">>
): Promise<Tax> => {
  // TODO: Replace with actual API call
  const index = mockTaxes.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Tax not found");

  mockTaxes[index] = {
    ...mockTaxes[index],
    ...tax,
    updatedAt: new Date().toISOString(),
  };
  return mockTaxes[index];
};

export const deleteTax = async (labId: string, id: string): Promise<void> => {
  // TODO: Replace with actual API call
  const index = mockTaxes.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Tax not found");
  mockTaxes.splice(index, 1);
};
