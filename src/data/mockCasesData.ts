import { format, addDays } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { SetStateAction } from "react";
import { LoadingState } from "@/pages/cases/NewCase";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
export interface Case {
  id: string;
  caseId: string;
  clientId: string;
  clientName: string;
  patientName?: string;
  caseType: string;
  caseStatus: CaseStatus;
  startDate: string;
  dueDate: string;
  appointmentDate?: string;
  appointmentTime?: string;
  assignedTechnicians?: string[];
  deliveryMethod: DeliveryMethod;
  notes?: {
    labNotes?: string;
    technicianNotes?: string;
  };
  stages: CaseStage[];
}

export interface CaseStage {
  name: string;
  status: "pending" | "in_progress" | "completed";
}

export type CaseStatus =
  | "In Queue"
  | "in_progress"
  | "On Hold"
  | "completed"
  | "cancelled"
  | "in_queue";
export type DeliveryMethod = "Pickup" | "Local Delivery" | "Shipping";

export const CASE_STATUSES: CaseStatus[] = [
  "In Queue",
  "in_progress",
  "On Hold",
  "completed",
  "cancelled",
  "in_queue",
];

export const DELIVERY_METHODS: DeliveryMethod[] = [
  "Pickup",
  "Local Delivery",
  "Shipping",
];

export const mockTechnicians = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Alice Johnson" },
  { id: "4", name: "Bob Wilson" },
];

// Initialize with some sample data
const defaultCases: Case[] = [
  {
    id: "1",
    caseId: "CASE001",
    clientId: "1",
    clientName: "Smile Dental Clinic",
    patientName: "Matthias Cook",
    caseType: "Crown",
    caseStatus: "in_progress",
    startDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    assignedTechnicians: ["1", "2"],
    deliveryMethod: "Local Delivery",
    stages: [
      { name: "Impression", status: "completed" },
      { name: "Modeling", status: "completed" },
      { name: "Custom Shading", status: "in_progress" },
      { name: "Finishing", status: "pending" },
    ],
  },
  {
    id: "2",
    caseId: "CASE002",
    clientId: "2",
    clientName: "Bright Smiles Orthodontics",
    patientName: "Emma Thompson",
    caseType: "Bridge",
    caseStatus: "in_progress",
    startDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    assignedTechnicians: ["3"],
    deliveryMethod: "Shipping",
    stages: [
      { name: "Impression", status: "completed" },
      { name: "Waxing", status: "in_progress" },
      { name: "Casting", status: "pending" },
      { name: "Finishing", status: "pending" },
    ],
  },
];

// Load cases from localStorage or use default cases
const loadCases = (): Case[] => {
  const savedCases = localStorage.getItem("cases");
  return savedCases ? JSON.parse(savedCases) : defaultCases;
};

// Save cases to localStorage
// const saveCases = (cases: Case[]) => {
//   localStorage.setItem("cases", JSON.stringify(cases));
// };
const saveCaseProduct = async (
  overview: any,
  cases: any,
  navigate?: any,
  savedCaseId?: string
) => {
  // Step 1: Create a row in the enclosed_case table
  try {
    const { data: caseProductData, error: caseProductError } = await supabase
      .from("case_products")
      .insert(overview)
      .select("*");

    if (caseProductError) {
      console.error("Error saving case products:", caseProductError);
      localStorage.setItem("cases", JSON.stringify(cases)); // Save to localStorage as a fallback
      return;
    }

    const caseProductId = caseProductData[0].id; // Assuming `id` is the `case_product_id`

    // Step 3: Map cases.products and create rows for case_product_teeth
    const caseProductTeethRows = cases.products.map((product: any) => ({
      case_product_id: caseProductId,
      is_range: cases.products.length > 0,
      occlusal_shade_id: product.shades.occlusal || "",
      body_shade_id: product.shades.body || "",
      gingival_shade_id: product.shades.gingival || "",
      stump_shade_id: product.shades.stump || "",
      notes: product.notes || "",
      tooth_number: product.teeth || "",
      product_id: product.id,
    }));

    // Calculate discounted prices for products
    const discountedPrice = cases.products.map((product: any) => ({
      product_id: product.id,
      price: product.price,
      discount: product.discount,
      final_price: product.price - (product.price * product.discount) / 100,
      case_id: savedCaseId as string,
      user_id: cases.overview.created_by,
    }));

    // Insert case_product_teeth rows
    const { error: caseProductTeethError } = await supabase
      .from("case_product_teeth")
      .insert(caseProductTeethRows)
      .select("");

    if (caseProductTeethError) {
      console.error(
        "Error creating case_product_teeth rows:",
        caseProductTeethError
      );
      return; // Exit if there is an error
    }

    // Step 4: Insert discount price rows
    const { error: discountPriceError } = await supabase
      .from("discounted_price")
      .insert(discountedPrice)
      .select("*");

    if (discountPriceError) {
      console.error("Error inserting discount prices:", discountPriceError);
      return; // Exit if there is an error
    } else {
      console.log("Discount prices inserted successfully!");
    }

    // Success message
    console.log(
      "case_product_teeth rows created and discount prices inserted successfully!"
    );
    toast.success("Case created successfully");
    navigate && navigate("/cases");
  } catch (error) {
    console.error("Error while processing case product:", error);
  }
};

const saveCases = async (
  cases: any,
  navigate?: any,
  setLoadingState?: React.Dispatch<SetStateAction<LoadingState>>
) => {
  try {
    // Step 1: Save enclosed case details
    const enclosedCaseRow = {
      impression: cases.enclosedItems?.impression || 0,
      biteRegistration: cases.enclosedItems?.biteRegistration || 0,
      photos: cases.enclosedItems?.photos || 0,
      jig: cases.enclosedItems?.jig || 0,
      opposingModel: cases.enclosedItems?.opposingModel || 0,
      articulator: cases.enclosedItems?.articulator || 0,
      returnArticulator: cases.enclosedItems?.returnArticulator || 0,
      cadcamFiles: cases.enclosedItems?.cadcamFiles || 0,
      consultRequested: cases.enclosedItems?.consultRequested || 0,
      user_id: cases.overview.created_by,
    };

    const { data: enclosedCaseData, error: enclosedCaseError } = await supabase
      .from("enclosed_case")
      .insert(enclosedCaseRow)
      .select("*");

    if (enclosedCaseError) {
      console.error("Error saving enclosed case:", enclosedCaseError);
      return;
    }

    const enclosedCaseId = enclosedCaseData[0].id; // Get the enclosed_case_id

    // Step 2: Save cases overview, adding enclosed_case_id to the overview
    const overviewWithEnclosedCaseId = {
      ...cases.overview,
      enclosed_case_id: enclosedCaseId,
    };

    const { data, error } = await supabase
      .from("cases")
      .upsert(overviewWithEnclosedCaseId, { onConflict: "id" })
      .select("*");

    if (error) {
      console.error("Error saving cases:", error);
      localStorage.setItem("cases", JSON.stringify(cases)); // Save to localStorage as a fallback
      return;
    }

    console.log("Cases saved successfully:", data);

    if (data) {
      const savedCaseId = data[0]?.id; // Assuming the 'id' of the saved/upserted case is returned
      const productIds = cases.products.map((item: any) => item.id);
      const updateDueDate = () => {
        const currentDate = new Date(); // Get the current date
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-indexed (0 = January, 11 = December)

        // Create a new date object for the 28th of the current month and year
        const dueDate = new Date(currentYear, currentMonth, 28);

        // Return the timestamp in milliseconds since the Unix epoch
        return dueDate.getTime();
      };

      // Step 3: Save case products
      try {
        const caseProduct = {
          user_id: cases.overview.created_by,
          case_id: savedCaseId,
          products_id: productIds,
        };
        await saveCaseProduct(caseProduct, cases, navigate, savedCaseId); // Save each case product
        console.log("All case products saved successfully.");
      } catch (productError) {
        console.error("Error saving case products:", productError);
      }

      // Step 4: Create invoice for the case
      const newInvoice = {
        case_id: savedCaseId,
        client_id: cases.overview.client_id,
        lab_id: cases.overview.lab_id,
        status: "Unpaid",
        due_date: updateDueDate(),
      };

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert(newInvoice)
        .select("*");

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
      } else {
        console.log("Invoice created successfully:", invoiceData);
        setLoadingState &&
          setLoadingState({ isLoading: false, action: "save" });
      }
    }

    // Step 5: Save the overview to localStorage
    localStorage.setItem("cases", JSON.stringify(cases));
  } catch (error) {
    console.error("Error in saveCases function:", error);
  }
};

// In-memory store initialized from localStorage
let cases: Case[] = loadCases();

// Function to get all cases
export const getCases = (): Case[] => {
  return cases || [];
};

// Function to get a case by ID
export const getCaseById = (id: string): Case | undefined => {
  return cases.find((caseItem) => caseItem.id === id);
};

// Function to add a new case
export const addCase = (
  newCase: Case,
  navigate?: any,
  setLoadingState?: React.Dispatch<SetStateAction<LoadingState>>
): void => {
  cases = [newCase];
  saveCases(newCase, navigate, setLoadingState);
};

// Function to update a case
export const updateCase = (updatedCase: Case): void => {
  cases = cases.map((caseItem) =>
    caseItem.id === updatedCase.id ? updatedCase : caseItem
  );
  saveCases(cases);
};

// Function to delete a case
export const deleteCase = (id: string): void => {
  cases = cases.filter((caseItem) => caseItem.id !== id);
  saveCases(cases);
};

// Function to get cases by status
export const getCasesByStatus = (status: CaseStatus): Case[] => {
  return cases.filter((caseItem) => caseItem.caseStatus === status);
};

// Function to get cases by technician
export const getCasesByTechnician = (technicianId: string): Case[] => {
  return cases.filter((caseItem) =>
    caseItem.assignedTechnicians?.includes(technicianId)
  );
};

export const fetchShadeOptions = async () => {
  try {
    const { data, error } = await supabase
      .from("shade_options") // Table name
      .select("*"); // Select all columns. Adjust if needed.

    if (error) {
      console.error("Error fetching shade options:", error.message);
      return null; // Return null or handle accordingly
    }

    console.log("Fetched shade options:", data);
    return data; // Return fetched items
  } catch (err) {
    console.error("Unexpected error fetching shade options:", err);
    return null; // Return null or handle accordingly
  }
};
