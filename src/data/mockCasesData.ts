import { format, addDays } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { SetStateAction } from "react";
import { LoadingState } from "@/pages/cases/NewCase";
import { CaseStatus } from "@/types/supabase";
import { SavedProduct } from "./mockProductData";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";

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
  status: CaseStatus;
  startDate: string;
  dueDate: string;
  appointmentDate?: string;
  appointmentTime?: string;
  assignedTechnicians?: string[];
  deliveryMethod: DeliveryMethod;
  notes?: {
    instructionNotes?: string;
    invoiceNotes?: string;
  };
  stages: CaseStage[];
}

export interface CaseStage {
  name: string;
  status: "pending" | "in_progress" | "completed";
}

export type DeliveryMethod = "Pickup" | "Local Delivery" | "Shipping";

export const CASE_STATUSES: CaseStatus[] = [
  "in_queue",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
];

export const CASE_STATUS_COLORS = {
  in_queue: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  on_hold: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

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
    caseId: "CASE-2023-001",
    clientId: "1",
    clientName: "Smile Dental Clinic",
    patientName: "Matthias Cook",
    caseType: "Crown",
    status: "in_progress",
    startDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    assignedTechnicians: ["1", "2"],
    deliveryMethod: "Pickup",
    stages: [
      { name: "Preparation", status: "completed" },
      { name: "Design", status: "in_progress" },
      { name: "Production", status: "pending" },
    ],
  },
  {
    id: "2",
    caseId: "CASE-2023-002",
    clientId: "2",
    clientName: "Bright Smiles Orthodontics",
    patientName: "Emma Thompson",
    caseType: "Bridge",
    status: "in_progress",
    startDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    assignedTechnicians: ["3"],
    deliveryMethod: "Shipping",
    stages: [
      { name: "Preparation", status: "completed" },
      { name: "Design", status: "in_progress" },
      { name: "Production", status: "pending" },
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
    console.log(cases.products, "cases.products");
    const caseProductTeethRows = cases.products.map((product: any) => ({
      case_product_id: caseProductId,
      is_range: cases.products.length > 0,
      tooth_number: product.teeth || "",
      product_id: product.id,
      type: product.type || "",
      lab_id: cases.overview.lab_id || "",
      quantity: product.quantity || 1,
      occlusal_shade_id:
        product.shades.occlusal_shade === "custom"
          ? null
          : product.shades.occlusal_shade || null,
      body_shade_id:
        product.shades.body_shade === "custom"
          ? null
          : product.shades.body_shade || null,
      gingival_shade_id:
        product.shades.gingival_shade === "custom"
          ? null
          : product.shades.gingival_shade || null,
      stump_shade_id:
        product.shades.stump_shade === "custom"
          ? null
          : product.shades.stump_shade || null,
      custom_body_shade: product?.shades.custom_body || null,
      custom_occlusal_shade: product?.shades.custom_occlusal || null,
      custom_gingival_shade: product?.shades.custom_gingival || null,
      custom_stump_shade: product?.shades.custom_stump || null,
      notes: product.notes || "",
      case_id: savedCaseId,
    }));

    // Calculate discounted prices for products
    const discountedPrice = cases.products.map((product: any) => ({
      product_id: product.id,
      price: product.price,
      discount: product.discount,
      quantity: product.quantity,
      final_price:
        (product.price - (product.price * product.discount) / 100) *
        product.quantity,
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
    navigate && navigate(`/cases/${savedCaseId}`);
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

      const totalAmount = cases.products.reduce(
        (sum: number, item: SavedProduct) => {
          const itemTotal = item.price * (item?.quantity ? item?.quantity : 1); // Total price without discount
          const discountedTotal =
            itemTotal - (itemTotal * (item.discount || 0)) / 100; // Apply discount
          return sum + discountedTotal; // Add to the sum
        },
        0
      );

      const newInvoice = {
        case_id: savedCaseId,
        client_id: cases.overview.client_id,
        lab_id: cases.overview.lab_id,
        amount: totalAmount,
        due_amount: totalAmount,
        status: "unpaid",
        due_date: null,
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
        await updateBalanceTracking();
      }
    }

    // Step 5: Save the overview to localStorage

    localStorage.setItem("cases", JSON.stringify(cases));
  } catch (error) {
    console.error("Error in saveCases function:", error);
  }
};
const updateCases = async (
  cases: any,
  navigate?: any,
  setLoadingState?: React.Dispatch<SetStateAction<LoadingState>>,
  caseId?: string
) => {
  try {
    setLoadingState && setLoadingState({ isLoading: true, action: "update" });
    console.log(
      cases.overview.enclosed_case_id,
      "cases.overview.enclosed_case_id"
    );
    // Step 1: Update enclosed case details
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
      .update(enclosedCaseRow)
      .eq("id", cases.overview.enclosed_case_id)
      .select("*");

    if (enclosedCaseError) {
      throw new Error(
        `Error updating enclosed case: ${enclosedCaseError.message}`
      );
    }

    console.log("Enclosed case updated successfully:", enclosedCaseData);

    // Step 2: Update cases overview
    const overviewWithEnclosedCaseId = {
      ...cases.overview,
      enclosed_case_id: cases.overview.enclosed_case_id,
    };

    const { data: caseOverviewData, error: caseOverviewError } = await supabase
      .from("cases")
      .update(overviewWithEnclosedCaseId)
      .eq("id", caseId)
      .select("*");

    if (caseOverviewError) {
      localStorage.setItem("cases", JSON.stringify(cases));
      throw new Error(`Error updating cases: ${caseOverviewError.message}`);
    }

    console.log("Cases updated successfully:", caseOverviewData);

    // Step 3: Update case products (instead of saving, we'll update)
    const productIds = cases.products.map((item: any) => item.id);
    const caseProduct = {
      user_id: cases.overview.created_by,
      case_id: caseId,
      products_id: productIds,
    };

    // Calculate discounted prices for products
    for (const product of cases.products) {
      // Prepare the data row
      const discountedPriceRow = {
        product_id: product.id,
        price: product.price || 0,
        discount: product.discount || 0,
        quantity: product.quantity,
        final_price:
          (product.price - (product.price * product.discount) / 100 || 0) *
          product.quantity,
        case_id: caseId,
        user_id: cases.overview.created_by || "",
      };

      console.log("Processing product:", product.id);

      // Fetch existing row by case_id and product_id
      const { data: existingRow, error: fetchError } = await supabase
        .from("discounted_price")
        .select("id") // Only fetch the ID for updates
        .eq("case_id", caseId)
        .eq("product_id", product.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // Log error if it's not "No rows found" (PGRST116 means no match)
        console.error(
          `Error fetching row for product_id: ${product.id}`,
          fetchError
        );
        continue; // Skip this product and move on to the next
      }

      if (existingRow) {
        // Update the existing row
        const { error: updateError } = await supabase
          .from("discounted_price")
          .update(discountedPriceRow)
          .eq("id", existingRow.id);

        if (updateError) {
          console.error(
            `Error updating row for product_id: ${product.id}`,
            updateError
          );
        } else {
          console.log(
            `Discounted price updated successfully for product_id: ${product.id}`
          );
        }
      } else {
        // Insert a new row
        const { error: insertError } = await supabase
          .from("discounted_price")
          .insert(discountedPriceRow);

        if (insertError) {
          console.error(
            `Error inserting row for product_id: ${product.id}`,
            insertError
          );
        } else {
          console.log(
            `Discounted price inserted successfully for product_id: ${product.id}`
          );
        }
      }
    }

    // Upsert case products
    const { data: caseProductData, error: caseProductError } = await supabase
      .from("case_products")
      .update(caseProduct)
      .eq("case_id", caseId)
      .select("*");

    if (caseProductError) {
      console.error("Error updating case products:", caseProductError);
    } else {
      console.log("Case products updated successfully:", caseProductData);
    }
    // Step 4: Update case_product_teeth (mapping products and creating/creating updated rows)
    // Step 4: Update or create case_product_teeth (mapping products and creating new rows if not exist)
    const caseProductTeethRows = cases.products.map((product: any) => ({
      case_product_id: caseProductData && caseProductData[0].id, // Use the ID of the updated/inserted case product
      is_range: cases.products.length > 0,
      product_id: product.id,
      type: product.type || "",
      lab_id: cases.overview.lab_id || "",
      quantity: product.quantity || 1,
      notes: product.notes || "",
      tooth_number: product.teeth || "",
      occlusal_shade_id:
        product.shades.occlusal_shade === "custom"
          ? null
          : product.shades.occlusal_shade || null,
      body_shade_id:
        product.shades.body_shade === "custom"
          ? null
          : product.shades.body_shade || null,
      gingival_shade_id:
        product.shades.gingival_shade === "custom"
          ? null
          : product.shades.gingival_shade || null,
      stump_shade_id:
        product.shades.stump_shade === "custom"
          ? null
          : product.shades.stump_shade || null,
      custom_body_shade: product?.shades.custom_body || null,
      custom_occlusal_shade: product?.shades.custom_occlusal || null,
      custom_gingival_shade: product?.shades.custom_gingival || null,
      custom_stump_shade: product?.shades.custom_stump || null,
      case_id: caseId,
    }));

    // Step to check if rows exist for product_id before inserting
    for (const row of caseProductTeethRows) {
      const { data: existingTeethRows, error: fetchError } = await supabase
        .from("case_product_teeth")
        .select("*")
        .eq("product_id", row.product_id)
        .eq("case_product_id", row.case_product_id); // Check for the combination of case_product_id and product_id

      if (fetchError) {
        console.error("Error fetching case_product_teeth rows:", fetchError);
        return; // Exit if there is an error
      }

      if (existingTeethRows.length === 0) {
        // No existing row found for this product_id, so insert a new row
        const { error: insertError } = await supabase
          .from("case_product_teeth")
          .insert([row]);

        if (insertError) {
          console.error(
            "Error inserting new case_product_teeth row:",
            insertError,
            console.log(row, "row")
          );
          return; // Exit if there is an error
        } else {
          console.log(
            `New case_product_teeth row created for product_id: ${row.product_id}`
          );
        }
      } else {
        // Existing row found, update the row if needed
        const { error: updateError } = await supabase
          .from("case_product_teeth")
          .update(row)
          .eq("product_id", row.product_id)
          .eq("case_product_id", row.case_product_id); // Update for the combination of case_product_id and product_id

        if (updateError) {
          console.error(
            "Error updating existing case_product_teeth row:",
            updateError
          );
          return; // Exit if there is an error
        } else {
          console.log(
            `Existing case_product_teeth row updated for product_id: ${row.product_id}`
          );
        }
      }
    }
    // Upsert case_product_teeth rows
    const { error: caseProductTeethError } = await supabase
      .from("case_product_teeth")
      .upsert(caseProductTeethRows)
      .select("");

    if (caseProductTeethError) {
      console.error(
        "Error updating case_product_teeth rows:",
        caseProductTeethError
      );
      return; // Exit if there is an error
    } else {
      console.log("Case product teeth rows updated successfully!");
      toast.success("Case updated successfully");
      if (navigate && caseId) {
        navigate(`/cases/${caseId}`, { state: { scrollToTop: true } });
      }
    }

    // Step 5: Update invoice for the case
    // const updateDueDate = () => {
    //   const currentDate = new Date();
    //   const dueDate = new Date(
    //     currentDate.getFullYear(),
    //     currentDate.getMonth(),
    //     28
    //   );
    //   return dueDate.toISOString().replace("T", " ").split(".")[0] + "+00";
    // };

    // const updatedInvoice = {
    //   client_id: cases.overview.client_id,
    //   lab_id: cases.overview.lab_id,
    //   status: cases.overview.status,
    //   due_date: updateDueDate(),
    // };

    // const { data: invoiceData, error: invoiceError } = await supabase
    //   .from("invoices")
    //   .upsert(updatedInvoice)
    //   .eq("case_id", caseId)
    //   .select("*");

    // if (invoiceError) {
    //   console.error("Error updating invoice:", invoiceError);
    // } else {
    //   console.log("Invoice updated successfully:", invoiceData);
    // }

    // Step 6: Save the updated overview to localStorage and navigate
    localStorage.setItem("cases", JSON.stringify(cases));
    // toast.success("Case updated successfully");
    // navigate && navigate("/cases");
  } catch (error) {
    console.error("Error in updateCases function:", error);
    toast.error("Failed to update case");
  } finally {
    setLoadingState && setLoadingState({ isLoading: false, action: "update" });
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
export const updateCase = (
  newCase: Case,
  navigate?: any,
  setLoadingState?: React.Dispatch<SetStateAction<LoadingState>>,
  caseId?: string
): void => {
  cases = [newCase];
  updateCases(newCase, navigate, setLoadingState, caseId);
};
// Function to delete a case
export const deleteCase = (id: string): void => {
  cases = cases.filter((caseItem) => caseItem.id !== id);
  saveCases(cases);
};

// Function to get cases by status
export const getCasesByStatus = (status: CaseStatus): Case[] => {
  return cases.filter((caseItem) => caseItem.status === status);
};

// Function to get cases by technician
export const getCasesByTechnician = (technicianId: string): Case[] => {
  return cases.filter((caseItem) =>
    caseItem.assignedTechnicians?.includes(technicianId)
  );
};

export const fetchShadeOptions = async (labId: string) => {
  try {
    const { data, error } = await supabase
      .from("shade_options") // Table name
      .select("*")
      .eq("lab_id", labId);

    if (error) {
      console.error("Error fetching shade options:", error.message);
      return null; // Return null or handle accordingly
    }

    console.log("Fetched shade options:", data);
    return data; // Return fetched itemsmeeting
  } catch (err) {
    console.error("Unexpected error fetching shade options:", err);
    return null; // Return null or handle accordingly
  }
};
