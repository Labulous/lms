import { supabase } from "@/lib/supabase";

export interface Tax {
  id?: string;
  name: string;
  description?: string;
  rate: number;
  is_active: string;
  created_at: string;
  updated_at: string;
}

// Mock data for development
// let mockTaxes: Tax[] = [
//   {
//     id: "1",
//     name: "Standard VAT",
//     description: "Standard Value Added Tax",
//     rate: 20,
//     isActive: true,
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   },
// ];

export const getTaxes = async (labId: string): Promise<Tax[]> => {
  // TODO: Replace with actual API call
  const { data: taxesData, error: taxesDataError } = await supabase
    .from("tax_configuration")
    .select("*")
    .eq("lab_id", labId)
    .order("created_at", { ascending: false });

  if (taxesData && taxesData.length > 0) {
    return taxesData;
  }

  return [];
};

export const createTax = async (
  labId: string,
  tax: Omit<Tax, "id" | "createdAt" | "updatedAt">
): Promise<Tax> => {
  // TODO: Replace with actual API call
  try {
    const { data: taxData, error: taxDataError } = await supabase
      .from("tax_configuration")
      .insert({
        ...tax,
        lab_id: labId,
      })
      .select("*")
      .single();

    if (taxDataError) {
      throw new Error("Failed to create new tax");
    }

    return taxData;
  } catch (error) {
    throw new Error("Failed to create new tax");
  }
};

export const updateTax = async (
  labId: string,
  id: string,
  tax: Partial<Omit<Tax, "id" | "createdAt" | "updatedAt">>
): Promise<Tax> => {
  // TODO: Replace with actual API call
  const { data: updatedTax, error: updatedTaxError } = await supabase
    .from("tax_configuration")
    .update(tax)
    .eq("id", id)
    .select("*")
    .single();

  if (updatedTaxError) {
    throw new Error("Failed to update the status");
  }

  return updatedTax;
};

export const deleteTax = async (labId: string, id: string): Promise<void> => {
  // TODO: Replace with actual API call
  const { data: deletedData, error: deletedDataError } = await supabase
    .from("tax_configuration")
    .delete()
    .eq("id", id); // Delete where id = 1

  if (deletedDataError) {
    throw new Error("Failed to delete the tax");
  }
};
