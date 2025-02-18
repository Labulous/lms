import { format, addDays } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { SetStateAction } from "react";
import { LoadingState } from "@/pages/cases/NewCase";
import { SavedProduct } from "./mockProductData";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";
import { duplicateInvoiceProductsByTeeth } from "@/lib/dulicateProductsByTeeth";
import { fetchCaseCount } from "@/utils/invoiceCaseNumberConversion";
import { getLabIdByUserId } from "@/services/authService";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const CASE_STATUSES = [
  "in_queue",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export type DeliveryMethod = "Pickup" | "Local Delivery" | "Shipping";

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

export const DELIVERY_METHODS: DeliveryMethod[] = [
  "Pickup",
  "Local Delivery",
  "Shipping",
];

export const CASE_STATUS_COLORS = {
  in_queue: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  on_hold: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

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
    const caseProductTeethRows = cases.products.flatMap(
      (main: any, index: number) => {
        return main.subRows.map((product: any) => {
          const serviceIds =
            product?.services?.map((item: { id: string }) => item.id) || [];
          const uniqueServiceId =
            [...new Set(serviceIds)].length === 1 ? [serviceIds[0]] : serviceIds;
          return {
            case_product_id: caseProductId, // Replace with the actual dynamic ID
            is_range: cases.products.length > 0,
            tooth_number: product.teeth || "",
            pontic_teeth: product.pontic_teeth || [],
            product_id: product.id,
            type: product.type || "",
            additional_services_id: uniqueServiceId || [],
            lab_id: cases.overview.lab_id || "",
            quantity: product.quantity || 1, // Ensure at least 1
            occlusal_shade_id:
              product.shades.occlusal_shade !== "manual" &&
              product.shades.custom_occlusal_shade !== ""
                ? product.shades.occlusal_shade
                : null,
            body_shade_id:
              product.shades.body_shade !== "manual" &&
              product.shades.custom_body_shade !== ""
                ? product.shades.body_shade
                : null,
            gingival_shade_id:
              product.shades.gingival_shade !== "manual" &&
              product.shades.custom_gingival_shade !== ""
                ? product.shades.gingival_shade
                : null,
            stump_shade_id:
              product.shades.stump_shade !== "manual" &&
              product.shades.custom_stump_shade !== ""
                ? product.shades.stump_shade
                : null,
            manual_body_shade: product?.shades.manual_body || null,
            manual_occlusal_shade: product?.shades.manual_occlusal || null,
            manual_gingival_shade: product?.shades.manual_gingival || null,
            manual_stump_shade: product?.shades.manual_stump || null,
            custom_body_shade: product?.shades.custom_body || null,
            custom_occlusal_shade: product?.shades.custom_occlusal || null,
            custom_gingival_shade: product?.shades.custom_gingival || null,
            custom_stump_shade: product?.shades.custom_stump || null,
            notes: product.notes || "",
            case_id: savedCaseId,
          };
        });
      }
    );

    console.log("api calling");
    console.log(caseProductTeethRows, "caseProductTeethRows");
    // Calculate discounted prices for products
    const discountedPrice = cases.products.flatMap((main: any) => {
      return main.subRows.map((product: any) => {
        // Ensure discount is valid
        const productDiscount = product.discount || 0;
        const serviceDiscount = product?.services?.[0]?.discount || 0;

        // Calculate price after discount for the product
        const priceAfterDiscount =
          productDiscount > 0
            ? product.price - (product.price * productDiscount) / 100
            : product.price;

        // Extract all `services[0].id` values
        const serviceIds = product.subRows
          ?.map((subRow: any) => subRow?.services?.[0]?.id)
          .filter(Boolean);

        // Determine if all service IDs are the same
        const uniqueServiceIds = new Set(serviceIds);
        const countServices =
          uniqueServiceIds.size === 1 ? 1 : serviceIds?.length;

        // Calculate service price after discount
        const servicePrice = product?.services?.[0]?.price || 0;
        const priceAfterDiscountService =
          serviceDiscount > 0
            ? servicePrice - (servicePrice * serviceDiscount) / 100
            : servicePrice;

        // Calculate final product price per unit
        const final_price = priceAfterDiscount * product.quantity;

        // Calculate total amount
        const amount = final_price * (product.teeth?.length || 1);

        return {
          product_id: product.id,
          price: product.price,
          discount: productDiscount,
          quantity: product.quantity,
          final_price: final_price,
          total: amount,
          case_id: savedCaseId as string,
          user_id: cases.overview.created_by,
          service_price: priceAfterDiscountService * countServices, // Adjust service price if all services are the same
          service_discount: serviceDiscount,
        };
      });
    });

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
  setLoadingState?: React.Dispatch<SetStateAction<LoadingState>>,
  identifier?: string
) => {
  try {
    // Step 1: Save enclosed case details
    const caseCount = await fetchCaseCount(cases.overview.lab_id); // Fetch current case count
    const labData = await getLabIdByUserId(cases.overview.created_by as string);

    if (!caseCount && typeof caseCount !== "number") {
      toast.error("Unable to get Case Number");
      setLoadingState && setLoadingState({ isLoading: false, action: "save" });
      return;
    }
    setLoadingState && setLoadingState({ isLoading: true, action: "save" });

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

    const { data: taxData, error: taxDataError } = await supabase
      .from("tax_configuration")
      .select("*")
      .eq("lab_id", cases.overview.lab_id)
      .eq("is_active", "Active");

    const totalTaxPercent = taxData?.reduce((sum: number, tax: any) => {
      return sum + (tax.rate || 0);
    }, 0);

    const { data: enclosedCaseData, error: enclosedCaseError } = await supabase
      .from("enclosed_case")
      .insert(enclosedCaseRow)
      .select("*");

    if (enclosedCaseError) {
      console.error("Error saving enclosed case:", enclosedCaseError);
      return;
    }

    const enclosedCaseId = enclosedCaseData[0].id; // Get the enclosed_case_id
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const sequentialNumber = String(caseCount + 1).padStart(5, "0");

    const case_number = `${labData?.name
      .substring(0, 3)
      .toUpperCase()}-${currentYear}${currentMonth}-${sequentialNumber}`; // Step 2: Save cases overview, adding enclosed_case_id to the overview
    const overviewWithEnclosedCaseId = {
      ...cases.overview,
      enclosed_case_id: enclosedCaseId,
      case_number,
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

    if (data) {
      const savedCaseId = data[0]?.id; // Assuming the 'id' of the saved/upserted case is returned
      const productIds = cases.products.map((item: any) => item.id);
      const serviceIds = cases.services.map((item: any) => item.id);

      // Step 3: Save case products
      try {
        const caseProduct = {
          user_id: cases.overview.created_by,
          case_id: savedCaseId,
          products_id: productIds,
          // services_id: serviceIds,
        };
        await saveCaseProduct(caseProduct, cases, navigate, savedCaseId); // Save each case product
        console.log("All case products saved successfully.");
      } catch (productError) {
        console.error("Error saving case products:", productError);
      }

      // Step 4: Create invoice for the case
      const totalSubRowAmount = cases.products.reduce(
        (sum: number, product: any) => {
          if (!product.subRows || product.subRows.length === 0) return sum;

          const subRowsTotal = product.subRows.reduce(
            (subSum: number, subRow: any) => {
              const finalDiscount = subRow.discount || 0;

              // Price after discount
              const priceAfterDiscount =
                subRow.price - (subRow.price * finalDiscount) / 100;

              // Calculate total amount (price * quantity * teeth length)
              const totalQuantity = subRow.quantity || 0;

              const amount = priceAfterDiscount * totalQuantity;
              return subSum + amount;
            },
            0
          );

          return sum + subRowsTotal;
        },
        0
      );

      const totalServiceAmount = cases.products.reduce(
        (sum: number, product: any) => {
          if (!product.subRows || product.subRows.length === 0) return sum;

          const serviceIds = product.subRows
            .map((subRow: any) => subRow?.services?.[0]?.id)
            .filter(Boolean); // Get all service[0].id values and remove undefined/null

          const uniqueServiceIds = new Set(serviceIds);

          const countServices =
            uniqueServiceIds.size === 1 ? 1 : serviceIds?.length; // If all IDs are the same, count 1; otherwise, count all

          const totalAmount = product.subRows.reduce(
            (subSum: number, subRow: any) => {
              if (!subRow?.services || subRow.services.length === 0)
                return subSum;

              const service = subRow.services[0];
              const finalDiscount = service.discount || 0;
              const priceAfterDiscount =
                service.price - (service.price * finalDiscount) / 100;

              return subSum + priceAfterDiscount;
            },
            0
          );

          return sum + (totalAmount / serviceIds.length) * countServices;
        },
        0
      );

      // Final Invoice Calculation
      const totalAmount = totalSubRowAmount + totalServiceAmount;
      console.log(totalAmount); // This will output the correct totalAmount

      const newInvoice = {
        case_id: savedCaseId,
        client_id: cases.overview.client_id,
        lab_id: cases.overview.lab_id,
        amount: Number(totalAmount),
        due_amount: Number(totalAmount),
        status: "unpaid",
        due_date: cases?.overview?.due_date,
      };
      console.log(totalAmount, "totalAmount");
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
        if (
          invoiceData &&
          invoiceData.length > 0 &&
          invoiceData[0]?.client_id
        ) {
          await updateBalanceTracking(invoiceData[0].client_id);
        }
      }
      const { data: count, error: caseCountError } = await supabase
        .from("case_number_tracker")
        .insert({
          case_number: caseCount + 1,
          case_id: savedCaseId,
          lab_id: cases.overview.lab_id,
        })
        .select("*");
      console.log(count, "count");
      if (caseCountError) {
        console.error("Error creating case count:", invoiceError);
      } else {
        console.log("case count created successfully:", invoiceData);
        setLoadingState &&
          setLoadingState({ isLoading: false, action: "save" });
        if (
          invoiceData &&
          invoiceData.length > 0 &&
          invoiceData[0]?.client_id
        ) {
          await updateBalanceTracking(invoiceData[0].client_id);
        }
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
  caseId?: string,
  oldAmount?: number,
  oldDueAmount?: number
) => {
  console.log(cases, "casescases");
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
      .eq("id", cases.enclosed_item_id)
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
      enclosed_case_id: cases.enclosed_case_id,
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
    const productIds = cases.products?.flatMap(
      (main: any) => main.subRows?.map((product: any) => product.id) || []
    );
    const caseProduct = {
      user_id: cases.overview.created_by,
      case_id: caseId,
      products_id: productIds,
    };
    console.log(productIds, "productIds");
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

    const { error: deleteCaseProductTeethError } = await supabase
      .from("case_product_teeth")
      .delete()
      .eq("case_id", caseId);

    if (deleteCaseProductTeethError) {
      toast.error("Faild to remove existing case products");
    }
    const { data: discountedPrices, error: discountedPricesError } =
      await supabase.from("discounted_prices").delete().eq("case_id", caseId);

    if (discountedPrices) {
      const { error: dicountedPriceError } = await supabase
        .from("discounted_prices")
        .delete()
        .eq("case_id", caseId);

      if (dicountedPriceError) {
        toast.error("Faild to remove existing prices");
      }
    }

    // Step 4: Update case_product_teeth (mapping products and creating/creating updated rows)
    const caseProductTeethRows = cases.products.flatMap(
      (main: any, index: number) => {
        return main.subRows.map((product: any) => {
          const serviceIds =
            product?.services?.map((item: { id: string }) => item.id) || [];
          const uniqueServiceId =
            [...new Set(serviceIds)].length === 1 ? serviceIds[0] : serviceIds;

          return {
            case_product_id: caseProductData?.[0]?.id, // Replace with the actual dynamic ID
            is_range: cases.products.length > 0,
            tooth_number: product.teeth || "",
            pontic_teeth: product.pontic_teeth || [],
            product_id: product.id,
            type: product.type || "",
            additional_services_id: uniqueServiceId || [],
            lab_id: cases.overview.lab_id || "",
            quantity: product.quantity || 1, // Ensure at least 1
            occlusal_shade_id:
              product.shades.occlusal_shade !== "manual" &&
              product.shades.custom_occlusal_shade !== ""
                ? product.shades.occlusal_shade
                : null,
            body_shade_id:
              product.shades.body_shade !== "manual" &&
              product.shades.custom_body_shade !== ""
                ? product.shades.body_shade
                : null,
            gingival_shade_id:
              product.shades.gingival_shade !== "manual" &&
              product.shades.custom_gingival_shade !== ""
                ? product.shades.gingival_shade
                : null,
            stump_shade_id:
              product.shades.stump_shade !== "manual" &&
              product.shades.custom_stump_shade !== ""
                ? product.shades.stump_shade
                : null,
            manual_body_shade: product?.shades.manual_body || null,
            manual_occlusal_shade: product?.shades.manual_occlusal || null,
            manual_gingival_shade: product?.shades.manual_gingival || null,
            manual_stump_shade: product?.shades.manual_stump || null,
            custom_body_shade: product?.shades.custom_body || null,
            custom_occlusal_shade: product?.shades.custom_occlusal || null,
            custom_gingival_shade: product?.shades.custom_gingival || null,
            custom_stump_shade: product?.shades.custom_stump || null,
            notes: product.notes || "",
            case_id: caseId,
          };
        });
      }
    );

    console.log("api calling");
    console.log(caseProductTeethRows, "caseProductTeethRows");
    // Calculate discounted prices for products
    const discountedPrice = cases.products.flatMap((main: any) => {
      return main.subRows.map((product: any) => {
        // Ensure discount is valid
        const productDiscount = product.discount || 0;
        const serviceDiscount = product?.services?.[0]?.discount || 0;

        // Calculate price after discount for the product
        const priceAfterDiscount =
          productDiscount > 0
            ? product.price - (product.price * productDiscount) / 100
            : product.price;

        // Extract all `services[0].id` values
        const serviceIds = product.subRows
          ?.map((subRow: any) => subRow?.services?.[0]?.id)
          .filter(Boolean);

        // Determine if all service IDs are the same
        const uniqueServiceIds = new Set(serviceIds);
        const countServices =
          uniqueServiceIds.size === 1 ? 1 : serviceIds.length;

        // Calculate service price after discount
        const servicePrice = product?.services?.[0]?.price || 0;
        const priceAfterDiscountService =
          serviceDiscount > 0
            ? servicePrice - (servicePrice * serviceDiscount) / 100
            : servicePrice;

        // Calculate final product price per unit
        const final_price = priceAfterDiscount * product.quantity;

        // Calculate total amount
        const amount = final_price * (product.teeth?.length || 1);

        return {
          product_id: product.id,
          price: product.price,
          discount: productDiscount,
          quantity: product.quantity,
          final_price: final_price,
          total: amount,
          case_id: caseId as string,
          user_id: cases.overview.created_by,
          service_price: priceAfterDiscountService * countServices, // Adjust service price if all services are the same
          service_discount: serviceDiscount,
        };
      });
    });

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
    const totalSubRowAmount = cases.products.reduce(
      (sum: number, product: any) => {
        if (!product.subRows || product.subRows.length === 0) return sum;

        const subRowsTotal = product.subRows.reduce(
          (subSum: number, subRow: any) => {
            const finalDiscount = subRow.discount || 0;

            // Price after discount
            const priceAfterDiscount =
              subRow.price - (subRow.price * finalDiscount) / 100;

            // Calculate total amount (price * quantity * teeth length)
            const totalQuantity = subRow.quantity || 0;

            const amount = priceAfterDiscount * totalQuantity;
            return subSum + amount;
          },
          0
        );

        return sum + subRowsTotal;
      },
      0
    );

    const totalServiceAmount = cases.products.reduce(
      (sum: number, product: any) => {
        if (!product.subRows || product.subRows.length === 0) return sum;

        const serviceIds = product.subRows
          .map((subRow: any) => subRow?.services?.[0]?.id)
          .filter(Boolean); // Get all service[0].id values and remove undefined/null

        const uniqueServiceIds = new Set(serviceIds);

        const countServices =
          uniqueServiceIds.size === 1 ? 1 : serviceIds.length; // If all IDs are the same, count 1; otherwise, count all

        const totalAmount = product.subRows.reduce(
          (subSum: number, subRow: any) => {
            if (!subRow?.services || subRow.services.length === 0)
              return subSum;

            const service = subRow.services[0];
            const finalDiscount = service.discount || 0;
            const priceAfterDiscount =
              service.price - (service.price * finalDiscount) / 100;

            return subSum + priceAfterDiscount;
          },
          0
        );

        return sum + (totalAmount / serviceIds.length) * countServices;
      },
      0
    );

    // Final Invoice Calculation
    const totalAmount = totalSubRowAmount + totalServiceAmount;

    const newInvoice = {
      case_id: caseId,
      client_id: cases.overview.client_id,
      lab_id: cases.overview.lab_id,
      amount: Number(totalAmount), // Total amount (subRows + services)
      due_amount: Number(totalAmount),
      status: "unpaid",
      due_date: cases?.overview?.due_date,
    };

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .update(newInvoice)
      .eq("id", cases.invoiceId)
      .select("*");

    if (invoiceError) {
      toast.error("failed to update Invoice Data");
      return;
    }
    cases.products.flatMap((main: any) => {
      return main.subRows.map((product: any) => {
        // Calculate the final discount

        // Calculate the price after final discount
        const priceAfterDiscount =
          product.price - (product.price * product.discount) / 100;

        // Calculate the total quantity based on main.quantity and product.quantity

        // Calculate final price (after discount) for the given quantity
        const final_price = priceAfterDiscount * product.quantity;

        // Calculate amount by multiplying final_price by teeth length (or 1 if teeth is empty)
        const amount = final_price * (product.teeth?.length || 1); // default to 1 if teeth is empty

        // Step 4: Insert discount price rows
        const updatedData = {
          product_id: product.id,
          price: product.price,
          discount: product.discount, // use the final discount
          quantity: product.quantity, // final quantity after adding main.quantity
          final_price: final_price, // price after final discount
          total: amount, // final price * total quantity * teeth length
          case_id: caseId as string,
          user_id: cases.overview.created_by,
        };
        const handleUpdateDiscountedPrice = async () => {
          if (product.discounted_price_id) {
            // Update the existing row if discounted_price_id exists
            const { error: discountPriceError } = await supabase
              .from("discounted_price")
              .update(updatedData)
              .eq("id", product.discounted_price_id)
              .select("*");

            if (discountPriceError) {
              console.error(
                "Error updating discount prices:",
                discountPriceError
              );
              return;
            }

            console.log("Discount prices updated successfully!");
            if (navigate && caseId) {
              navigate(`/cases/${caseId}`, { state: { scrollToTop: true } });
            }
          } else {
            // Insert a new row if discounted_price_id does not exist
            const newData = {
              ...updatedData, // Include existing data
              product_id: product.id, // Ensure product ID is included
            };

            const { error: insertError } = await supabase
              .from("discounted_price")
              .insert([newData])
              .select("*");

            if (insertError) {
              console.error("Error inserting new discount price:", insertError);
              return;
            }

            console.log("New discount price inserted successfully!");
            if (navigate && caseId) {
              navigate(`/cases/${caseId}`, { state: { scrollToTop: true } });
            }
          }
        };

        handleUpdateDiscountedPrice();
      });
    });
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
  caseId?: string,
  oldAmount?: number,
  oldDueAmount?: number
): void => {
  cases = [newCase];
  updateCases(
    newCase,
    navigate,
    setLoadingState,
    caseId,
    oldAmount,
    oldDueAmount
  );
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
