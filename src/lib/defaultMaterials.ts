import toast from "react-hot-toast";
import { supabase } from "./supabase";

export const defaultMaterials = [
  { name: "E.Max", description: "E.max ceramic material", is_active: true },
  { name: "MISC", description: "needs to be updated", is_active: true },
  {
    name: "Acrylic",
    description: "Acrylic material for dental prosthetics",
    is_active: true,
  },
  { name: "Implant", description: "needs to be updated.", is_active: true },
  {
    name: "Full Cast",
    description: "Full cast metal material",
    is_active: true,
  },
  { name: "PFM", description: "Porcelain Fused to Metal", is_active: true },
  {
    name: "Zirconia",
    description: "Zirconia ceramic material",
    is_active: true,
  },
  {
    name: "Denture",
    description: "Material used for dentures",
    is_active: true,
  },
  {
    name: "General Service",
    description: "General Service Default description",
    is_active: true,
  },
];

export const handleSetDefaultMaterials = async (lab_id: string) => {
  try {
    // Insert the default materials into the Supabase database
    const { data, error } = await supabase
      .from("materials") // Replace with your table name
      .insert(defaultMaterials.map((item) => ({ ...item, lab_id: lab_id }))); // Use insert to add new records

    if (error) {
      throw error;
    }

    // Notify the user that the materials were successfully added
    toast.success("Default materials have been set successfully!");
  } catch (error: any) {
    // Handle errors
    console.error("Error setting default materials:", error.message);
    toast.error("There was an error setting the default materials!");
  }
};
