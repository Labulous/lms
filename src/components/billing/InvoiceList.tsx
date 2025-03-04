import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import {
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon,
  Trash,
  Loader2,
  Pencil,
  MoreHorizontal,
  Check,
  Banknote,
  FileText,
  Table,
  Bell,
  Percent as PercentIcon,
  Clock as ClockIcon,
  Trash2,
  CheckCircle,
  Printer as PrinterIcon,
} from "lucide-react";
import {
  mockInvoices,
  Invoice,
  updateInvoice,
} from "../../data/mockInvoicesData";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";
import { getLabDataByUserId, getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { EditInvoiceModal } from "./EditInvoiceModal";
import { toast } from "react-hot-toast";
import { DiscountedPrice, labDetail } from "@/types/supabase";
import jsPDF from "jspdf";
import InvoicePreviewModal from "../invoices/InvoicePreviewModal";
import { NewPaymentModal } from "./NewPaymentModal";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import CaseDetailsDrawer from "@/components/cases/CaseDetailsDrawer";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { InvoiceTemplate } from "@/components/cases/print/PrintTemplates";
import { ExtendedCase } from "../cases/CaseDetails";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// import { generatePDF } from "@/lib/generatePdf";

type SortConfig = {
  key: keyof Invoice;
  direction: "asc" | "desc";
};

type BulkAction =
  | "export"
  | "delete"
  | "markPaid"
  | "sendReminder"
  | "exportPDF"
  | "exportCSV"
  | "changeDueDate"
  | "applyDiscount"
  | "changePaymentTerms"
  | "approve"
  | "save"
  | "approvePrint";

interface ModalState {
  isOpen: boolean;
  type: BulkAction | null;
}

interface LoadingState {
  action: BulkAction | null;
  isLoading: boolean;
  progress?: number;
}
type DiscountedPriceMap = {
  [key: string]: DiscountedPrice; // Assuming product_id is a string; use `number` if it's a number
};
const BATCH_SIZE = 50; // Process 50 items at a time

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesData, setInvoicesData] = useState<any>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [lab, setLab] = useState<labDetail | null>(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "desc",
  });
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
  });
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>("net30");
  const [loadingState, setLoadingState] = useState<LoadingState>({
    action: null,
    isLoading: false,
  });
  const [processingFeedback, setProcessingFeedback] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [dueDateRange, setDueDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<Invoice["status"][]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [reFreshData, setRefreshData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] =
    useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isCaseDrawerOpen, setIsCaseDrawerOpen] = useState(false);

  const { user } = useAuth();

  // Initialize invoices
  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    supabase.from("users").select("lab_id").eq("id", user?.id).single(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (labError) {
    return <div>Loading!!!</div>;
  }
  const { data: query, error: caseError } = useQuery(
    labIdData?.lab_id
      ? supabase
        .from("cases")
        .select(
          `
       id,
        created_at,
        received_date,
        ship_date,
        status,
        patient_name,
        due_date,
        attachements,
        case_number,
        invoice:invoices!case_id (
          id,
          case_id,
          amount,
          status,
          due_amount,
          due_date
        ),
        client:clients!client_id (
          id,
          client_name,
          phone,
          street,
          city,
          state,
          zip_code
        ),
        doctor:doctors!doctor_id (
          id,
          name,
          client:clients!client_id (
            id,
            client_name,
            phone
          )
        ),
        tag:working_tags!working_tag_id (
          name,
          color
        ),
        working_pan_name,
        working_pan_color,
        rx_number,
        received_date,
        invoice_notes,
        isDueDateTBD,
        appointment_date,
        instruction_notes,
        otherItems,
        occlusal_type,
        contact_type,
        pontic_type,
        qr_code,
        custom_contact_details,
        custom_occulusal_details,
        custom_pontic_details,
        enclosed_items:enclosed_case!enclosed_case_id (
          impression,
          biteRegistration,
          photos,
          jig,
          opposingModel,
          articulator,
          returnArticulator,
          cadcamFiles,
          consultRequested,
          user_id
        ),
        created_by:users!created_by (
          name,
          id
        ),
        product_ids:case_products!id (
          products_id,
          id
        ),
         margin_design_type,
        occlusion_design_type,
        alloy_type,
        custom_margin_design_type,
        custom_occlusion_design_type,
        custon_alloy_type,
      discounted_price:discounted_price!id (
                id,
                product_id,
                discount,
                final_price,
                price,
                quantity,
                total
          ),
        teethProduct: case_product_teeth!id (
          id,
          is_range,
          tooth_number,
          product_id,
          occlusal_shade:shade_options!occlusal_shade_id (
          name,
          category,
          is_active
          ),
           body_shade:shade_options!body_shade_id (
           name,
           category,
            is_active
            ),
            gingival_shade:shade_options!gingival_shade_id (
            name,
            category,
             is_active
             ),
             stump_shade:shade_options!stump_shade_id (
               name,
              category,
              is_active
                    ),
                  pontic_teeth,
                  notes,
                  product_id,
                  custom_body_shade,
                  custom_occlusal_shade,
                  custom_gingival_shade,
                  custom_stump_shade,
                  type,
          product:products!product_id (
                    id,
                    name,
                    price,
                    lead_time,
                    is_client_visible,
                    is_taxable,
                    created_at,
                    updated_at,
                    requires_shade,
                    material:materials!material_id (
                      name,
                      description,
                      is_active
                    ),
                    product_type:product_types!product_type_id (
                      name,
                      description,
                      is_active
                    ),
                    billing_type:billing_types!billing_type_id (
                      name,
                      label,
                      description,
                      is_active
                    )
          )
          )
    `
        )
        .eq("lab_id", labIdData?.lab_id)
        .order("created_at", { ascending: false })
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000,
    }
  );
  if (caseError && labIdData?.lab_id) {
    // toast.error("failed to fetech cases");
  }

  const swrInvoices: Invoice[] | [] =
    query?.map((item: any) => {
      return {
        ...item,
        products: item.teethProduct.map((tp: any) => ({
          id: tp.product.id,
          name: tp.product.name,
          price: tp.product.price,
          lead_time: tp.product.lead_time,
          is_client_visible: tp.product.is_client_visible,
          is_taxable: tp.product.is_taxable,
          created_at: tp.product.created_at,
          updated_at: tp.product.updated_at,
          requires_shade: tp.product.requires_shade,
          material: tp.product.material,
          product_type: tp.product.product_type,
          billing_type: tp.product.billing_type,
          discounted_price: item?.discounted_price.filter(
            (item: any) => item.product_id === tp.product.id
          )?.[0],
          teethProduct: {
            id: tp.id,
            is_range: tp.is_range,
            tooth_number: tp.tooth_number,
            product_id: tp.product_id,
            occlusal_shade: tp.occlusal_shade,
            body_shade: tp.body_shade,
            gingival_shade: tp.gingival_shade,
            stump_shade: tp.stump_shade,
            manual_occlusal_shade: tp.manual_occlusal_shade,
            manual_body_shade: tp.manual_body_shade,
            manual_gingival_shade: tp.manual_gingival_shade,
            manual_stump_shade: tp.manual_stump_shade,
            custom_occlusal_shade: tp.custom_occlusal_shade,
            custom_body_shade: tp.custom_body_shade,
            custom_gingival_shade: tp.custom_gingival_shade,
            custom_stump_shade: tp.custom_stump_shade,
            custom_occlusal_details: tp.occlusal_shade,
            notes: tp.notes,
            type:tp.type
          },
        })),
      };
    }) || [];
  const getCompletedInvoices = async () => {
    setLoading(true);
    try {
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select(
          `
          id,
          created_at,
          received_date,
          ship_date,
          status,
          patient_name,
          due_date,
          client:clients!client_id (
            id,
            client_name,
            phone,
            street,
            city,
            state,
            zip_code
          ),
          doctor:doctors!doctor_id (
            id,
            name,
            client:clients!client_id (
              id,
              client_name,
              phone
            )
          ),
          tag:working_tags!working_tag_id (
              name,
              color
            ),
        working_pan_name,
        working_pan_color,
          rx_number,
          isDueDateTBD,
          appointment_date,
          case_number,
          otherItems,
          invoice_notes,
          occlusal_type,
          contact_type,
          pontic_type,
          custom_contact_details,
          custom_occulusal_details,
          custom_pontic_details,
          enclosed_items:enclosed_case!enclosed_case_id (
            impression,
            biteRegistration,
            photos,
            jig,
            opposingModel,
            articulator,
            returnArticulator,
            cadcamFiles,
            consultRequested,
            user_id
          ),
          invoice:invoices!case_id (
            id,
            case_id,
            amount,
            status,
            due_amount,
            due_date
          ),
          product_ids:case_products!id (
            products_id,
            id
          )
        `
        )
        .eq("lab_id", labIdData?.lab_id)
        .order("created_at", { ascending: false });

      if (casesError) {
        console.error("Error fetching invoices:", casesError);
        return;
      }

      const enhancedCases = await Promise.all(
        casesData.map(async (singleCase) => {
          const productsIdArray =
            singleCase?.product_ids?.map((p) => p.products_id) || [];
          const caseProductIds =
            singleCase?.product_ids?.map((p) => p.id) || [];

          if (productsIdArray.length === 0) {
            return { ...singleCase, products: [] }; // No products for this case
          }

          // Fetch products for the current case
          const { data: productData, error: productsError } = await supabase
            .from("products")
            .select(
              `
              id,
              name,
              price,
              lead_time,
              is_client_visible,
              is_taxable,
              created_at,
              updated_at,
              requires_shade,
              material:materials!material_id (
                name,
                description,
                is_active
              ),
              product_type:product_types!product_type_id (
                name,
                description,
                is_active
              ),
              billing_type:billing_types!billing_type_id (
                name,
                label,
                description,
                is_active
              )
            `
            )
            .eq("lab_id", labIdData?.lab_id)
            .in("id", productsIdArray);

          if (productsError) {
            console.error("Error fetching products for case:", productsError);
            return { ...singleCase, products: [] }; // Return empty products if there's an error
          }

          const { data: discountedPriceData, error: discountedPriceError } =
            await supabase
              .from("discounted_price")
              .select(
                `
              id,
              product_id,
              discount,
              final_price,
              price,
              quantity
            `
              )
              .in("product_id", productsIdArray)
              .eq("case_id", singleCase.id);

          if (discountedPriceError) {
            console.error(
              "Error fetching discounted prices for case:",
              discountedPriceError
            );
          }

          const { data: teethProductData, error: teethProductsError } =
            await supabase
              .from("case_product_teeth")
              .select(
                `
              id,
              is_range,
              tooth_number,
              product_id,
              occlusal_shade:shade_options!occlusal_shade_id (
                name,
                category,
                is_active
              ),
              body_shade:shade_options!body_shade_id (
                name,
                category,
                is_active
              ),
              gingival_shade:shade_options!gingival_shade_id (
                name,
                category,
                is_active
              ),
              stump_shade:shade_options!stump_shade_id (
                name,
                category,
                is_active
              )
            `
              )
              .in("product_id", productsIdArray)
              .eq("case_product_id", singleCase?.product_ids[0]?.id);

          if (teethProductsError) {
            console.error("Error fetching teeth products:", teethProductsError);
          }
          console.log(teethProductData, "teethProductData");
          // Combine products with their relevant discounts and teeth products
          const productsWithDiscounts = productData.flatMap((product: any) => {
            const relevantDiscounts =
              discountedPriceData?.filter(
                (discount: { product_id: string }) =>
                  discount.product_id === product.id
              ) || [];

            const relevantTeethProducts =
              teethProductData?.filter(
                (teeth: any) => teeth.product_id === product.id
              ) || [];

            return relevantTeethProducts
              .map((teeth: any, index: number) => {
                const discountedPrice = relevantDiscounts[index] || null;

                return {
                  ...product,
                  discounted_price: { ...discountedPrice },
                  teethProduct: {
                    ...teeth,
                  },
                };
              })
              .filter((item) => item.teethProduct.tooth_number !== null);
          });

          return {
            ...singleCase,
            products: productsWithDiscounts,
            labDetail: lab,
          };
        })
      );

      setInvoicesData(enhancedCases);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
      setRefreshData(false);
    }
  };

  useEffect(() => {
    if (reFreshData) {
      getCompletedInvoices();
      setRefreshData(false);
    }
    const initialInvoices = mockInvoices;
    setInvoices(initialInvoices);
    setFilteredInvoices(initialInvoices);
    setInvoicesData(swrInvoices);
  }, [user?.id, reFreshData, swrInvoices]);
  useEffect(() => {
    const getLabData = async () => {
      const lab = await getLabDataByUserId(user?.id as string);
      if (lab) {
        setLab(lab);
      }
    };
    getLabData();
  }, []);
  const [caseFilter, setCaseFilter] = useState<string>("");
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editMode, setEditMode] = useState<"edit" | "payment">("edit");

  const handleOpenEditModal = (
    invoice: Invoice,
    mode: "edit" | "payment" = "edit"
  ) => {
    setTimeout(() => {
      setEditingInvoice(invoice);
      setEditMode(mode);
    }, 0);
  };

  const handleCloseEditModal = () => {
    setTimeout(() => {
      setEditingInvoice(null);
      setEditMode("edit");
    }, 0);
  };

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    const updatedProductIds = updatedInvoice?.items?.map((item) => item.id);

    const { data: casesData, error: CaseDataerror } = await supabase
      .from("cases")
      .select(`
    client_id
  `)
      .eq("id", updatedInvoice.id)
      .order("created_at", { ascending: false });

    if (CaseDataerror) {
      throw new Error(CaseDataerror.message);
    }

    try {
      setLoadingState({ isLoading: true, action: "save" });

      const { data: updatedCaseProducts, error: updateCaseProductsError } =
        await supabase
          .from("case_products")
          .update({ products_id: updatedProductIds })
          .eq("case_id", updatedInvoice.id)
          .select();

      if (updateCaseProductsError) {
        throw new Error(updateCaseProductsError.message);
      }
      for (const item of updatedInvoice?.items || []) {
        try {
          // Calculate the final price based on the quantity, unit price, and discount
          const finalPrice =
            item.quantity *
            Number(item.unitPrice) *
            (1 - (item.discount || 0) / 100);

          if (item.discountId && item.caseProductTeethId) {
            // Update the discounted_price table
            const { data: updatedDiscount, error: updateDiscountError } =
              await supabase
                .from("discounted_price")
                .update({
                  discount: item.discount,
                  quantity: item.quantity || 1,
                  price: item.unitPrice,
                  final_price: finalPrice,
                })
                .eq("id", item.discountId)
                .select();

            if (updateDiscountError) {
              throw new Error(updateDiscountError.message);
            }

            // Update the case_product_teeth table
            const { data: updateTeeth, error: updateTeethError } =
              await supabase
                .from("case_product_teeth")
                .update({
                  tooth_number: [item.toothNumber],
                })
                .eq("id", item.caseProductTeethId)
                .select("*");
          } else {
            // Create a new discounted_price row
            const { data: newDiscount, error: newDiscountError } =
              await supabase
                .from("discounted_price")
                .insert([
                  {
                    discount: item.discount,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    final_price: finalPrice,
                    product_id: item.id,
                    case_id: updatedInvoice.id,
                    user_id: user?.id,
                  },
                ])
                .select();

            if (newDiscountError) {
              throw new Error(newDiscountError.message);
            }

            console.log("Created new discount row:", newDiscount);

            // Create a new case_product_teeth row
            const { data: newTeeth, error: newTeethError } = await supabase
              .from("case_product_teeth")
              .insert([
                {
                  tooth_number: [Number(item.toothNumber)],
                  product_id: item.id, // Ensure to include the product_id
                  case_id: updatedInvoice.id,
                  lab_id: lab?.id,
                  case_product_id: updatedCaseProducts[0].id,
                },
              ])
              .select("*");

            if (newTeethError) {
              throw new Error(newTeethError.message);
            }

            console.log("Created new teeth row:", newTeeth);
          }
          if (casesData && casesData.length > 0 && casesData[0]?.client_id) {
            await updateBalanceTracking(casesData[0]?.client_id);
          }

        } catch (error) {
          console.error(
            `Error processing item with productId ${item.id}:`,
            error
          );
          // Optionally, continue with the next item instead of throwing
        }
      }

      const { error: updateCasesError } = await supabase
        .from("cases")
        .update({
          invoice_notes: updatedInvoice?.notes?.invoiceNotes,
        })
        .eq("id", updatedInvoice.id);

      if (updateCasesError) {
        throw new Error(updateCasesError.message);
      }
      function updateInvoice(
        old_amount: number,
        new_amount: number,
        due_amount: number
      ) {
        let paid_amount = old_amount - due_amount;
        let new_due_amount = Math.max(0, new_amount - paid_amount);

        return {
          amount: new_amount,
          due_amount: new_due_amount,
        };
      }

      const { error: updateInvoicesError } = await supabase
        .from("invoices")
        .update(
          updateInvoice(
            Number(updatedInvoice.oldTotalAmount),
            Number(updatedInvoice.totalAmount),
            Number(updatedInvoice.totalDue)
          )
        )
        .eq("case_id", updatedInvoice.id);

      if (updateInvoicesError) {
        throw new Error(updateInvoicesError.message);
      }

      toast.success("Invoice and related data updated successfully");

      handleCloseEditModal();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setLoadingState({ isLoading: false, action: null });
      setRefreshData(true);
    }
  };

  const handleCaseClick = (invoice: any) => {
    console.log("Invoice clicked:", invoice);
    // The invoice IS the case since we're querying the cases table
    const caseId = invoice?.id;
    if (caseId) {
      setSelectedCase(caseId);
      setIsCaseDrawerOpen(true);
    } else {
      console.error("No case ID found in invoice:", invoice);
    }
  };

  // Cleanup function for modal state
  useEffect(() => {
    return () => {
      setEditingInvoice(null);
      setEditMode("edit");
    };
  }, []);

  useEffect(() => {
    let lastActiveElement: HTMLElement | null = null;

    if (editingInvoice) {
      lastActiveElement = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const lastActiveElement = document.activeElement as HTMLElement | null;
      if (lastActiveElement && "focus" in lastActiveElement) {
        lastActiveElement.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
      if (lastActiveElement && "focus" in lastActiveElement) {
        lastActiveElement.focus();
      }
    };
  }, [editingInvoice]);

  useEffect(() => {
    const completedCaseInvoices = mockInvoices.filter(
      (invoice) => invoice?.case?.status === "completed"
    );
    setInvoices(completedCaseInvoices);
    setFilteredInvoices(completedCaseInvoices);
  }, []);

  useEffect(() => {
    const filtered = getFilteredInvoices();
    setFilteredInvoices(filtered);
  }, [
    searchTerm,
    dateFilter,
    dueDateRange,
    statusFilter,
    tagFilter,
    caseFilter,
    invoices,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    // Only search through invoices that belong to the current lab
    const filtered = invoicesData.filter((invoice: any) => {
      // First check if this invoice belongs to the current lab
      if (invoice.lab_id !== labIdData?.lab_id) {
        return false;
      }

      const searchableFields = [
        invoice.case_number,
        invoice?.doctor?.client?.client_name,
        invoice?.patient_name,
        invoice?.invoice?.[0]?.status,
      ];

      return searchableFields.some((field) =>
        field?.toString().toLowerCase().includes(term)
      );
    });

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getStatusBadgeVariant = (
    status: Invoice["status"],
    /* eslint-disable no-unused-vars */
    _invoice?: Invoice
  ): string => {
    switch (status) {
      case "unpaid":
        return "UnPaid";
      case "pending":
        return "pending";
      case "draft":
        return "secondary";
      case "approved":
        return "info";
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSort = (key: keyof Invoice) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortData = (data: Invoice[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a: any, b: any) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.received_date || 0).getTime();
        const dateB = new Date(b.received_date || 0).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortConfig.key === "tag") {
        const tagA = a.tag?.name || "";
        const tagB = b.tag?.name || "";
        return sortConfig.direction === "asc" 
          ? tagA.localeCompare(tagB)
          : tagB.localeCompare(tagA);
      }
      if (sortConfig.key === "amount") {
        const numA = Number(a.amount) || 0;
        const numB = Number(b.amount) || 0;
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      const valueA = String(a[sortConfig.key] || "").toLowerCase();
      const valueB = String(b[sortConfig.key] || "").toLowerCase();

      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  };

  const getSortIcon = (key: keyof Invoice) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  const processBatch = async (
    _invoiceBatch: string[],
    action: BulkAction,
    currentBatch: number,
    totalBatches: number
  ) => {
    const progress = Math.round((currentBatch / totalBatches) * 100);
    setLoadingState((prev) => ({ ...prev, progress }));
    setProcessingFeedback(
      `Processing batch ${currentBatch} of ${totalBatches} (${progress}%)`
    );

    switch (action) {
      case "exportPDF":
        await setIsPreviewModalOpen(true);
        break;
      case "exportCSV":
        exportToCSV();
        break;
      case "delete":
      case "markPaid":
      case "sendReminder":
        await new Promise((resolve) => setTimeout(resolve, 200));
        break;
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (
      ["changeDueDate", "applyDiscount", "changePaymentTerms"].includes(action)
    ) {
      setModalState({ isOpen: true, type: action });
      return;
    }

    setLoadingState({ action, isLoading: true });
    const totalItems = selectedInvoices.length;
    const batches = Math.ceil(totalItems / BATCH_SIZE);

    try {
      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalItems);
        const batch = selectedInvoices.slice(start, end);
        await processBatch(batch, action, i + 1, batches);
      }

      // Apply changes after all batches are processed
      switch (action) {
        case "delete":
          const remainingInvoices = invoicesData.filter(
            (invoice: Invoice) =>
              !selectedInvoices.includes(invoice.id as string)
          );
          setInvoices(remainingInvoices);
          setFilteredInvoices(remainingInvoices);
          setSelectedInvoices([]);
          break;
        case "markPaid":
          const paidInvoices = invoicesData.map((invoice: Invoice) => {
            if (selectedInvoices.includes(invoice.id as string)) {
              return { ...invoice, status: "paid" as const };
            }
            return invoice;
          });
          setInvoices(paidInvoices);
          setFilteredInvoices(paidInvoices);
          break;
        case "approve":
        case "approvePrint":
          const updatedInvoices = invoicesData.map((invoice: Invoice) => {
            if (selectedInvoices.includes(invoice.id as string)) {
              return { ...invoice, status: "approved" as const };
            }
            return invoice;
          });
          setInvoices(updatedInvoices);
          setFilteredInvoices(updatedInvoices);
          setSelectedInvoices([]);
          break;
      }

      // setProcessingFeedback("Processing completed successfully!");
    } catch (error) {
      setProcessingFeedback("Error occurred during processing");
      console.error("Bulk action error:", error);
    } finally {
      setTimeout(() => {
        setLoadingState({ action: null, isLoading: false });
        setProcessingFeedback("");
      }, 2000);
    }
  };

  const handleModalSubmit = async () => {
    const action = modalState.type;
    if (!action) return;

    setLoadingState({ action, isLoading: true });
    const totalItems = selectedInvoices.length;
    const batches = Math.ceil(totalItems / BATCH_SIZE);

    try {
      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalItems);
        const batch = selectedInvoices.slice(start, end);
        await processBatch(batch, action, i + 1, batches);
      }

      switch (action) {
        case "changeDueDate":
          if (newDueDate) {
            const updatedInvoices = invoices.map((invoice) => {
              if (selectedInvoices.includes(invoice.id as string)) {
                return { ...invoice, dueDate: newDueDate as unknown as string };
              }
              return invoice;
            });
            setInvoices(updatedInvoices);
            setFilteredInvoices(updatedInvoices);
          }
          break;
        case "applyDiscount":
          const updatedInvoices = invoices.map((invoice) => {
            if (invoice.id && selectedInvoices.includes(invoice.id)) {
              const discount =
                discountType === "percentage"
                  ? invoice.totalAmount
                    ? invoice.totalAmount * (discountValue / 100)
                    : 0
                  : discountValue;

              return {
                ...invoice,
                totalAmount: invoice.totalAmount
                  ? invoice.totalAmount - discount
                  : 0,
                discount: { type: discountType, value: discountValue },
              };
            }
            return invoice;
          });

          setInvoices(updatedInvoices);
          setFilteredInvoices(updatedInvoices);
          break;
        case "changePaymentTerms":
          const updatedTermsInvoices = invoices.map((invoice) => {
            if (selectedInvoices.includes(invoice.id as string)) {
              return { ...invoice, paymentTerms };
            }
            return invoice;
          });
          setInvoices(updatedTermsInvoices);
          setFilteredInvoices(updatedTermsInvoices);
          break;
      }

      setProcessingFeedback("Changes applied successfully!");
    } catch (error) {
      setProcessingFeedback("Error occurred while applying changes");
      console.error("Modal submit error:", error);
    } finally {
      setTimeout(() => {
        setLoadingState({ action: null, isLoading: false });
        setProcessingFeedback("");
        setModalState({ isOpen: false, type: null });
      }, 2000);
    }
  };

  const getSortedAndPaginatedData = () => {
    const data = searchTerm ? filteredInvoices : invoicesData;

    // Apply date range filter
    const dateRangeFiltered = dueDateRange
      ? data.filter((invoice: any) => {
          if (!invoice.invoice?.[0]?.due_date) return false;
          const dueDate = new Date(invoice.invoice[0].due_date);
          
          if (dueDateRange.from && dueDateRange.to) {
            // Create a copy of the end date and set it to the end of the day
            const endDate = new Date(dueDateRange.to);
            endDate.setHours(23, 59, 59, 999);
            
            return dueDate >= dueDateRange.from && dueDate <= endDate;
          } else if (dueDateRange.from) {
            return dueDate >= dueDateRange.from;
          } else if (dueDateRange.to) {
            // Create a copy of the end date and set it to the end of the day
            const endDate = new Date(dueDateRange.to);
            endDate.setHours(23, 59, 59, 999);
            
            return dueDate <= endDate;
          }
          return true;
        })
      : data;

    // Apply status filter if any
    const statusFiltered =
      statusFilter.length > 0
        ? dateRangeFiltered.filter((invoice: any) =>
          statusFilter.includes(invoice?.invoice?.[0]?.status)
        )
        : dateRangeFiltered;

    // Apply tag filter if any
    const tagFiltered =
      tagFilter.length > 0
        ? statusFiltered.filter((invoice: any) =>
          invoice?.tag && tagFilter.includes(invoice.tag.name)
        )
        : statusFiltered;

    // Apply sorting
    const sorted = sortData(tagFiltered);

    // Get paginated data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          (invoice?.invoiceNumber
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ??
            false) ||
          (invoice?.clientName
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ??
            false) ||
          (invoice?.patient
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ??
            false) ||
          (invoice?.case?.id
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ??
            false)
      );
    }

    filtered = filtered.filter((invoice) => {
      const matchesDate =
        !dateFilter ||
        (invoice.date &&
          format(new Date(invoice.date), "yyyy-MM-dd") ===
          format(dateFilter, "yyyy-MM-dd"));
        
      const matchesDueDate = !dueDateRange || !invoice.invoice?.[0]?.due_date
      ? true
      : (dueDateRange.from && dueDateRange.to)
      ? (new Date(invoice.invoice[0].due_date) >= dueDateRange.from &&
         new Date(invoice.invoice[0].due_date) <= dueDateRange.to)
      : dueDateRange.from
      ? new Date(invoice.invoice[0].due_date) >= dueDateRange.from
      : dueDateRange.to
      ? new Date(invoice.invoice[0].due_date) <= dueDateRange.to
      : true;

      return matchesDate && matchesDueDate;
    });

    if (statusFilter.length > 0) {
      filtered = filtered.filter((invoice) =>
        statusFilter.includes(invoice.status)
      );
    }

    if (tagFilter.length > 0) {
      filtered = filtered.filter((invoice) =>
        invoice?.tag && tagFilter.includes(invoice.tag.name)
      );
    }

    if (caseFilter) {
      filtered = filtered.filter((invoice) => invoice.case?.id === caseFilter);
    }

    return filtered;
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const allStatuses: Invoice["status"][] = [
    "unpaid",
    "pending",
    "paid",
    "partially_paid",
    "overdue",
    "cancelled",
    "approved",
  ];

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={9} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-muted-foreground">No invoices found</p>
          <Button
            variant="link"
            onClick={() => navigate("/billing/create-invoice")}
            className="mt-2"
          >
            Create your first invoice
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const handleDownload = (_id: string) => {
    console.log("download clciked");
  };

  const handleDelete = (_id: string) => {
    console.log("download clciked");
  };

  const handleApprove = (id: string) => {
    updateInvoice(id, { status: "approved" });
  };

  const handleApproveAndPrint = async (id: string) => {
    await updateInvoice(id, { status: "approved" });
    handleDownload(id);
  };

  const canApproveBulk =
    selectedInvoices.length > 0 &&
    selectedInvoices.every((id) => {
      const invoice = invoices.find((inv) => inv.id === id);
      return invoice?.status === "draft";
    });

  const canDeleteBulk =
    selectedInvoices.length > 0 &&
    selectedInvoices.every((id) => {
      const invoice = invoices.find((inv) => inv.id === id);
      return ["draft", "overdue"].includes(invoice?.status || "");
    });

  const invoiceData = {
    invoiceNumber: "4507",
    id: "INC-2024-00-00",
    date: "1/7/2025",
    shipTo: {
      name: "Brookmere Dental Group",
      address: [
        "Kourosh Milani",
        "North Road Coquitlam 101-531",
        "Coquitlam, BC V3J 1N7",
      ],
      phone: "604 492 3388",
    },
    patient: "WILLIAM WALLACE",
    items: [
      {
        description: "Digital Model - Quadrant (DISCOUNTED)",
        details: "(2 x $0.00)",
        amount: 0.0,
      },
      {
        description: "Full Cast Posterior Crown (Alloy Extra)",
        details: "Teeth: #46",
        amount: 140.0,
      },
    ],
    reference: "J4",
  };

  const handlePrintInvoice = () => {
    // generatePDF("elementId", "MyDocument.pdf");
  };

  const handleNewPayment = async (paymentData: any) => {
    console.log("New payment data:", paymentData);

    try {
      const {
        updatedInvoices,
        client,
        date,
        paymentMethod,
        paymentAmount,
        overpaymentAmount,
        remainingBalance,
      } = paymentData;

      if (!updatedInvoices || !client) {
        console.error("Missing updatedInvoices or client information.");
        return;
      }

      // Step 1: Update invoices
      for (const invoice of updatedInvoices) {
        const dueAmount = invoice.invoicesData[0]?.due_amount || 0;
        const { id } = invoice.invoicesData[0];
        const status = dueAmount === 0 ? "paid" : "partially_paid";

        const invoiceUpdate = {
          status,
          due_amount: dueAmount,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("invoices")
          .update(invoiceUpdate)
          .eq("id", id)
          .eq("lab_id", lab?.id);

        if (updateError) {
          throw new Error(
            `Failed to update invoice with ID ${id}: ${updateError.message}`
          );
        }
      }

      console.log("All invoices updated successfully.");

      // Step 2: Insert payment data
      const paymentDataToInsert = {
        client_id: client,
        payment_date: date,
        amount: paymentAmount,
        payment_method: paymentMethod,
        status: "completed",
        over_payment: overpaymentAmount || 0,
        remaining_payment: remainingBalance || 0,
        lab_id: lab?.id,
      };

      const { data: insertedPayment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentDataToInsert)
        .select("*");

      if (paymentError) {
        throw new Error(`Failed to insert payment: ${paymentError.message}`);
      }

      console.log("Payment inserted successfully.", insertedPayment);

      if (insertedPayment && insertedPayment.length > 0 && insertedPayment[0]?.client_id) {
        await updateBalanceTracking(insertedPayment[0]?.client_id);
      }

      
    } catch (err) {
      console.error("Error handling new payment:", err);
      toast.error("Failed to add payment or update balance tracking.");
    } finally {
      toast.success("New payment added successfully.");
      setShowNewPaymentModal(false);
    }
  };

  const handleInvoiceClick = (invoice: any) => {
    setSelectedInvoices([invoice?.id as string]);
    setSelectedInvoiceForPreview(invoice);
    setIsPreviewModalOpen(true);
  };

  const exportToCSV = () => {
    // Get the data to export - use the same data source as what's displayed in the table
    const dataToExport = selectedInvoices.length > 0
      ? getSortedAndPaginatedData().filter(invoice => selectedInvoices.includes(invoice.id as string))
      : getSortedAndPaginatedData();
    
    console.log("Data to export:", dataToExport);
    
    if (!dataToExport.length) {
      toast.error("No invoices to export");
      setLoadingState({ action: null, isLoading: false });
      return;
    }

    try {
      // Define CSV headers
      const headers = [
        "Invoice #",
        "Date",
        "Tag",
        "Status",
        "Client",
        "Case #",
        "Amount",
        "Due Date"
      ];
      
      // Function to escape CSV values properly
      const escapeCSV = (value: any) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // If the value contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Create CSV rows from the data
      const rows = dataToExport.map(invoice => {
        // Format invoice number
        const invoiceNumber = invoice.case_number 
          ? `INV-${invoice.case_number.split("-").slice(1).join("-")}`
          : "N/A";
          
        // Format date
        const date = invoice?.received_date
          ? new Date(invoice.received_date).toLocaleDateString()
          : "N/A";
          
        // Get tag
        const tag = invoice.tag?.name || "N/A";
        
        // Get status
        const status = invoice?.invoice?.[0]?.status
          ? `${invoice.invoice[0].status.charAt(0).toUpperCase()}${invoice.invoice[0].status.slice(1)}`
          : "N/A";
          
        // Get client name
        const client = invoice?.client?.client_name || "N/A";
        
        // Get case number
        const caseNumber = invoice.case_number || "N/A";
        
        // Calculate amount
        const amount = (
          (typeof invoice.amount === "number" ? invoice.amount : 0) +
          (invoice?.products?.reduce(
            (sum, item) =>
              sum +
              (typeof item.discounted_price?.final_price === "number"
                ? item.discounted_price.final_price
                : 0),
            0
          ) ?? 0)
        ).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        });
        
        // Format due date
        const dueDate = invoice?.due_date
          ? new Date(invoice.due_date).toLocaleDateString()
          : "N/A";
          
        // Return array of values in the same order as headers
        return [
          escapeCSV(invoiceNumber),
          escapeCSV(date),
          escapeCSV(tag),
          escapeCSV(status),
          escapeCSV(client),
          escapeCSV(caseNumber),
          escapeCSV(amount),
          escapeCSV(dueDate)
        ];
      });
      
      // Combine headers and rows into CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      console.log("CSV Content:", csvContent);
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setLoadingState({ action: null, isLoading: false });
      setProcessingFeedback("");
    }
  };

  return (
    <div className="relative">
      {isCaseDrawerOpen && selectedCase && (
        <Drawer
          open={isCaseDrawerOpen}
          onOpenChange={setIsCaseDrawerOpen}
          direction="right"
        >
          <DrawerContent direction="right" className="w-[90%] max-w-5xl">
            <DrawerHeader className="border-b border-gray-200">
              <DrawerTitle>Case Details</DrawerTitle>
              <DrawerClose onClick={() => setIsCaseDrawerOpen(false)} />
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto">
              <CaseDetailsDrawer
                caseId={selectedCase}
                onClose={() => setIsCaseDrawerOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <InvoicePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        caseDetails={
          selectedInvoiceForPreview ? [selectedInvoiceForPreview] : []
        }
      />

      <div className="space-y-4" id="elementId">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {selectedInvoices.length > 0 ? (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  {selectedInvoices.length}{" "}
                  {selectedInvoices.length === 1 ? "item" : "items"} selected
                </span>
                {canApproveBulk && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("approve")}
                      disabled={loadingState.isLoading}
                    >
                      {loadingState.action === "approve" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleBulkAction("approvePrint")}
                      disabled={loadingState.isLoading}
                    >
                      {loadingState.action === "approvePrint" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PrinterIcon className="mr-2 h-4 w-4" />
                      )}
                      Approve + Print
                    </Button>
                  </>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsPreviewModalOpen(true)}
                  disabled={loadingState.isLoading}
                >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print Invoices
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingState.isLoading}
                    >
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      More Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("sendReminder")}
                      className="flex items-center"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Send Reminder</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("exportCSV")}
                      className="flex items-center"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Export to CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Popover>
                      <PopoverTrigger asChild>
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span>Change Due Date</span>
                        </DropdownMenuItem>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0" 
                        align="center" 
                        side="top"
                        sideOffset={5}
                        avoidCollisions={true}
                        collisionPadding={20}
                        sticky="always"
                      >
                        <div className="p-4">
                          <DateRangePicker
                            dateRange={dueDateRange}
                            onDateRangeChange={setDueDateRange}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              className="pl-8"
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <TableComponent>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        getSortedAndPaginatedData().length > 0 &&
                        getSortedAndPaginatedData().every((invoice) =>
                          selectedInvoices.includes(invoice.id as string)
                        )
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInvoices(
                            getSortedAndPaginatedData().map(
                              (invoice) => invoice.id as string
                            )
                          );
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("date")}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center">
                      Date
                      {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="p-0 hover:bg-transparent">
                          <div className="flex items-center">
                            Tag
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                            {tagFilter.length > 0 && (
                              <Badge variant="outline" className="ml-2 bg-background">
                                {tagFilter.length}
                              </Badge>
                            )}
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2 grid gap-2">
                          {Array.from<string>(
                            new Set<string>(
                              invoicesData
                                .map((invoice: any) => invoice?.tag?.name as string | undefined)
                                .filter((name: string | undefined): name is string => Boolean(name))
                            )
                          ).map((tagName: string) => {
                            const tag = invoicesData.find(
                              (invoice: any) => invoice?.tag?.name === tagName
                            )?.tag;
                            return (
                              <div
                                key={tagName}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`tag-${tagName}`}
                                  checked={tagFilter.includes(tagName)}
                                  onCheckedChange={(checked) => {
                                    setTagFilter((current) =>
                                      checked
                                        ? [...current, tagName]
                                        : current.filter((t) => t !== tagName)
                                    );
                                  }}
                                />
                                <label
                                  htmlFor={`tag-${tagName}`}
                                  className="flex items-center text-sm font-medium cursor-pointer"
                                >
                                  <div
                                    className="flex items-center gap-2"
                                    style={{
                                      color: tag?.color,
                                    }}
                                  >
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor: tag?.color,
                                      }}
                                    />
                                    {tagName}
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("invoiceNumber")}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center">
                      Invoice #{getSortIcon("invoiceNumber")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("status")}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex items-center hover:text-primary">
                          Status
                          {getSortIcon("status")}
                          {statusFilter.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {statusFilter.length}
                            </Badge>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-2" align="start">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b">
                            <span className="text-sm font-medium">
                              Filter by Status
                            </span>
                            {statusFilter.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStatusFilter([])}
                                className="h-8 px-2 text-xs"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          {[
                            "unpaid",
                            "paid",
                            "partially_paid",
                            "overdue",
                            "cancelled",
                          ].map((status, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`status-${status}`}
                                checked={
                                  statusFilter.includes(
                                    status as
                                    | "draft"
                                    | "unpaid"
                                    | "pending"
                                    | "approved"
                                    | "paid"
                                    | "overdue"
                                    | "partially_paid"
                                    | "cancelled"
                                  )
                                    ? true
                                    : false
                                }
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setStatusFilter(
                                      (prev) => [...prev, status] as any
                                    );
                                  } else {
                                    setStatusFilter((prev) =>
                                      prev.filter((s) => s !== status)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`status-${status}`}
                                className="flex items-center text-sm font-medium cursor-pointer"
                              >
                                <Badge
                                  variant={
                                    getStatusBadgeVariant(
                                      status as Invoice["status"]
                                    ) as
                                    | "filter"
                                    | "secondary"
                                    | "success"
                                    | "destructive"
                                    | "default"
                                    | "warning"
                                    | "outline"
                                    | "Crown"
                                    | "Bridge"
                                    | "Removable"
                                    | "Implant"
                                    | "Coping"
                                    | "Appliance"
                                  }
                                >
                                  {status === "partially_paid"
                                    ? "Partially Paid"
                                    : status.charAt(0).toUpperCase() +
                                    status.slice(1)}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("clientName")}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center">
                      Client
                      {getSortIcon("clientName")}
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center">Case #</div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("amount")}
                    className="cursor-pointer text-right whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end">
                      Amount
                      {getSortIcon("amount")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("dueDate")}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <span>Due Date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={dueDateRange ? "secondary" : "ghost"}
                            size="icon"
                            className={cn(
                              "h-8 w-8 p-0",
                              dueDateRange 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "bg-transparent hover:bg-muted"
                            )}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent sort trigger
                            }}
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {dueDateRange && (
                              <span className="sr-only">
                                {dueDateRange.from ? format(dueDateRange.from, "LLL dd, y") : ""} -{" "}
                                {dueDateRange.to ? format(dueDateRange.to, "LLL dd, y") : ""}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0" 
                          align="center" 
                          side="top"
                          sideOffset={5}
                          avoidCollisions={true}
                          collisionPadding={20}
                          sticky="always"
                        >
                          <div className="p-4">
                            <DateRangePicker
                              dateRange={dueDateRange}
                              onDateRangeChange={setDueDateRange}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      {getSortIcon("dueDate")}
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : getSortedAndPaginatedData().length === 0 ? (
                  <EmptyState />
                ) : (
                  getSortedAndPaginatedData().map(
                    (invoice: Invoice, index: React.Key | null | undefined) => (
                      <TableRow
                        key={index}
                        className={cn(
                          selectedInvoices.includes(invoice.id as string) &&
                          "bg-muted/50",
                          "hover:bg-muted/50 transition-colors"
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.includes(
                              invoice.id as string
                            )}
                            onCheckedChange={() => {
                              if (
                                selectedInvoices.includes(invoice.id as string)
                              ) {
                                setSelectedInvoices((prev) =>
                                  prev.filter(
                                    (id) => id !== (invoice.id as string)
                                  )
                                );
                              } else {
                                setSelectedInvoices((prev) => [
                                  ...prev,
                                  invoice.id as string,
                                ]);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice?.received_date
                            ? format(
                              new Date(invoice?.received_date),
                              "dd/MM/yy"
                            )
                            : "No Date"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice?.tag && (
                            <div
                              className="flex items-center justify-start gap-2 text-xs"
                              style={{
                                color: invoice.tag.color,
                              }}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: invoice.tag.color,
                                }}
                              />
                              {invoice.tag.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <HoverCard openDelay={200}>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                className="text-blue-600 hover:underline"
                                onClick={() => {
                                  setSelectedInvoices([invoice?.id as string]);
                                  setIsPreviewModalOpen(true);
                                }}
                              >
                                {invoice.case_number
                                  ? `INV-${invoice.case_number
                                    .split("-")
                                    .slice(1)
                                    .join("-")}`
                                  : "No Invoice #"}
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent
                              className="w-[600px] p-0 overflow-hidden max-h-[800px]"
                              side="right"
                              sideOffset={20}
                              align="start"
                            >
                              <div className="w-full">
                                <div
                                  className="w-full transform scale-[0.85] origin-top-left -mt-4"
                                  style={{
                                    transform: "scale(0.85) translateX(20px)",
                                  }}
                                >
                                  <InvoiceTemplate
                                    paperSize="LETTER"
                                    caseDetails={[invoice]}
                                  />
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice?.invoice?.[0]?.status
                                ? (getStatusBadgeVariant(
                                  invoice.invoice[0].status as
                                  | "draft"
                                  | "unpaid"
                                  | "pending"
                                  | "approved"
                                  | "paid"
                                  | "overdue"
                                  | "partially_paid"
                                  | "cancelled"
                                ) as
                                  | "filter"
                                  | "secondary"
                                  | "success"
                                  | "destructive"
                                  | "default"
                                  | "warning"
                                  | "outline"
                                  | "Crown"
                                  | "Bridge"
                                  | "Removable"
                                  | "Implant"
                                  | "Coping"
                                  | "Appliance"
                                )
                                : "Bridge"
                            }
                          >
                            {invoice?.invoice?.[0]?.status
                              ? invoice.invoice[0].status
                                .charAt(0)
                                .toUpperCase() +
                              invoice.invoice[0].status.slice(1)
                              : "No Status"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice?.client?.client_name || "Unknown Client"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCaseClick(invoice);
                            }}
                          >
                            {invoice.case_number}
                          </button>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          $
                          {(
                            (typeof invoice.amount === "number"
                              ? invoice.amount
                              : 0) +
                            (invoice?.products?.reduce(
                              (sum, item) =>
                                sum +
                                (typeof item.discounted_price?.final_price ===
                                  "number"
                                  ? item.discounted_price.final_price
                                  : 0),
                              0
                            ) ?? 0)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(
                            invoice?.due_date ?? "2000-01-01"
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              {invoice.status === "draft" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleApprove(invoice.id as string)
                                    }
                                    className="cursor-pointer text-primary focus:text-primary-foreground focus:bg-primary"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleApproveAndPrint(
                                        invoice.id as string
                                      )
                                    }
                                    className="cursor-pointer text-primary focus:text-primary-foreground focus:bg-primary"
                                  >
                                    <PrinterIcon className="mr-2 h-4 w-4" />
                                    Approve + Print
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedInvoices([invoice?.id as string]);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {/* {["draft", "overdue"].includes(
                                invoice.status as
                                | "draft"
                                | "unpaid"
                                | "pending"
                                | "approved"
                                | "paid"
                                | "overdue"
                                | "partially_paid"
                                | "cancelled"
                              ) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenEditModal(invoice, "edit")
                                    }
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Invoice
                                  </DropdownMenuItem>
                                )} */}
                              {/* {["unpaid", "partially_paid", "paid"].includes(
                                invoice.invoice?.[0]?.status as
                                | "draft"
                                | "unpaid"
                                | "pending"
                                | "approved"
                                | "paid"
                                | "overdue"
                                | "partially_paid"
                                | "cancelled"
                              ) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenEditModal(invoice, "payment")
                                    }
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Invoice
                                  </DropdownMenuItem>
                                )} */}
                              {["unpaid", "partially_paid"].includes(
                                invoice.invoice?.[0]?.status as
                                | "draft"
                                | "unpaid"
                                | "pending"
                                | "approved"
                                | "paid"
                                | "overdue"
                                | "partially_paid"
                                | "cancelled"
                              ) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setShowNewPaymentModal(true);
                                      setSelectedClient(
                                        invoice.client?.id as string
                                      );
                                      setSelectedInvoice(
                                        invoice?.invoice?.[0]?.id as string
                                      );
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownload(invoice.id as string)
                                }
                                className="cursor-pointer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              {["draft", "overdue"].includes(
                                invoice.status as
                                | "draft"
                                | "unpaid"
                                | "pending"
                                | "approved"
                                | "paid"
                                | "overdue"
                                | "partially_paid"
                                | "cancelled"
                              ) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDelete(invoice.id as string)
                                      }
                                      className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete Invoice
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </TableComponent>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-center flex-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="hidden sm:flex transition-all duration-200 hover:scale-105"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden sm:flex transition-all duration-200 hover:scale-105"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="w-[180px]" /> {/* Spacer to balance the layout */}
        </div>
        {loadingState.isLoading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="text-lg">
                {loadingState.action === "exportPDF" && "Exporting as PDF..."}
                {loadingState.action === "exportCSV" && "Exporting as CSV..."}
                {loadingState.action === "delete" && "Deleting..."}
                {loadingState.action === "markPaid" && "Marking as paid..."}
                {loadingState.action === "sendReminder" &&
                  "Sending reminders..."}
                {loadingState.action === "changeDueDate" &&
                  "Changing due date..."}
                {loadingState.action === "applyDiscount" &&
                  "Applying discount..."}
                {loadingState.action === "changePaymentTerms" &&
                  "Changing payment terms..."}
                {loadingState.action === "approve" && "Approving..."}
                {loadingState.action === "approvePrint" &&
                  "Approving and printing..."}
                <br />
                {processingFeedback}
                <br />
                {loadingState.progress}% complete
              </div>
            </div>
          </div>
        )}

        {editingInvoice && (
          <EditInvoiceModal
            invoice={editingInvoice}
            mode={"edit"}
            onClose={handleCloseEditModal}
            onSave={handleSaveInvoice}
          />
        )}

        <InvoicePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
          }}
          caseDetails={invoicesData
            .filter((invoice: any) => selectedInvoices.includes(invoice.id)) // Filter based on selected invoices
            .map((invoice: any) => ({
              ...invoice, // Spread the invoice data
              labDetail: lab, // Add the `lab` data to each invoice
            }))}
        />

        {showNewPaymentModal && (
          <NewPaymentModal
            onClose={() => {
              console.log("Closing new payment modal");
              setShowNewPaymentModal(false);
            }}
            onSubmit={handleNewPayment}
            isSingleInvoice={true}
            clientId={selectedClient}
            invoiceId={selectedInvoice}
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceList;