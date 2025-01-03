import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  X,
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
import { supabase } from "@/lib/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { EditInvoiceModal } from "./EditInvoiceModal";
import { toast } from "react-hot-toast";
import { DiscountedPrice } from "@/types/supabase";

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
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<Invoice["status"][]>([]);
  const [reFreshData, setRefreshData] = useState(false);
  const { user } = useAuth();

  // Initialize invoices
  useEffect(() => {
    const getCompletedInvoices = async () => {
      setLoading(true); // Set loading state to true when fetching data

      try {
        const lab = await getLabIdByUserId(user?.id as string);

        if (!lab?.labId) {
          console.error("Lab ID not found.");
          return;
        }

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
              phone
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
            pan_number,
            rx_number,
            isDueDateTBD,
            appointment_date,
            case_number,
            otherItems,
            lab_notes,
            invoice_notes,
            technician_notes,
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
            invoicesData:invoices!case_id (
            case_id,
            amount,
            status,
            due_date
            ),
            product_ids:case_products!id (
              products_id,
              id
            )
          `
          )
          .eq("lab_id", lab.labId)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (casesError) {
          console.error("Error fetching completed invoices:", casesError);
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
              .in("id", productsIdArray);

            if (productsError) {
              console.error("Error fetching products for case:", productsError);
            }
            const { data: discountedPriceData, error: discountedPriceError } =
              await supabase
                .from("discounted_price")
                .select(
                  `
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
                is_range,
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
                tooth_number,
                product_id
              `
                )
                .in("product_id", productsIdArray)
                .eq("case_product_id", singleCase?.product_ids[0].id);

            if (teethProductsError) {
              console.error(
                "Error fetching teeth products:",
                teethProductsError
              );
            }
            const discountedPriceMap: DiscountedPriceMap = (
              discountedPriceData ?? []
            ).reduce((acc: DiscountedPriceMap, item: DiscountedPrice) => {
              acc[item.product_id] = item;
              return acc;
            }, {} as DiscountedPriceMap);
            const teethProductMap: any = (teethProductData ?? []).reduce(
              (acc: any, item: any) => {
                acc[item.product_id] = item;
                return acc;
              },
              {} as any
            );

            const products = productData?.map((product) => {
              return {
                ...product,
                discounted_price: discountedPriceMap[product.id] || null,
                teethProducts: teethProductMap[product.id] || null,
              };
            });
            return {
              ...singleCase,
              products,
            };
          })
        );

        setInvoicesData(enhancedCases);
      } catch (error) {
        console.error("Error fetching completed invoices:", error);
      } finally {
        setLoading(false);
        setRefreshData(false);
      }
    };

    getCompletedInvoices();
    const initialInvoices = mockInvoices;
    setInvoices(initialInvoices);
    setFilteredInvoices(initialInvoices);
  }, [user?.id, reFreshData]);

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
    const updatedProductIds = updatedInvoice.items.map((item) => item.id);

    try {
      setLoadingState({ isLoading: true, action: "save" });

      const { data: updatedCaseProducts, error: updateCaseProductsError } =
        await supabase
          .from("case_products")
          .update({ products_id: updatedProductIds })
          .eq("case_id", updatedInvoice.caseId)
          .select();

      if (updateCaseProductsError) {
        throw new Error(updateCaseProductsError.message);
      }

      for (const updatedCaseProduct of updatedCaseProducts) {
        const { id: caseProductId, products_id } = updatedCaseProduct;

        if (Array.isArray(products_id)) {
          for (const product_id of products_id) {
            const { data: existingTeeth, error: fetchError } = await supabase
              .from("case_product_teeth")
              .select("id")
              .eq("case_product_id", caseProductId)
              .eq("product_id", product_id)
              .single();

            if (fetchError && fetchError.code !== "PGRST116") {
              throw new Error(fetchError.message);
            }

            if (existingTeeth) {
              const { error: updateTeethError } = await supabase
                .from("case_product_teeth")
                .update({
                  tooth_number: [
                    updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0]?.toothNumber,
                  ],
                })
                .eq("case_product_id", caseProductId)
                .eq("product_id", product_id);

              if (updateTeethError) throw new Error(updateTeethError.message);
            } else {
              const { error: insertTeethError } = await supabase
                .from("case_product_teeth")
                .insert({
                  case_product_id: caseProductId,
                  product_id,
                  tooth_number: [
                    updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0].toothNumber,
                  ],
                });

              if (insertTeethError) throw new Error(insertTeethError.message);
            }

            const { data: existingDiscount, error: discountFetchError } =
              await supabase
                .from("discounted_price")
                .select("id")
                .eq("case_id", updatedInvoice.caseId)
                .eq("product_id", product_id)
                .single();

            if (discountFetchError && discountFetchError.code !== "PGRST116") {
              throw new Error(discountFetchError.message);
            }

            if (existingDiscount) {
              const { data: updatedDiscount, error: updateDiscountError } =
                await supabase
                  .from("discounted_price")
                  .update({
                    discount: updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0].discount,
                    quantity: updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0].quantity,
                    price: updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0].unitPrice,
                    final_price:
                      updatedInvoice.items.filter(
                        (item) => item.id === product_id
                      )[0].quantity *
                      updatedInvoice.items.filter(
                        (item) => item.id === product_id
                      )[0].unitPrice *
                      (1 -
                        (updatedInvoice.items.filter(
                          (item) => item.id === product_id
                        )[0].discount || 0) /
                          100),
                  }) // Update discount value
                  .eq("case_id", updatedInvoice.caseId)
                  .eq("product_id", product_id)
                  .select();

              if (updateDiscountError)
                throw new Error(updateDiscountError.message);
            } else {
              const { error: insertDiscountError } = await supabase
                .from("discounted_price")
                .insert({
                  case_id: updatedInvoice.caseId,
                  product_id,
                  discount: updatedInvoice.items.filter(
                    (item) => item.id === product_id
                  )[0].discount, // New discount value
                  quantity: updatedInvoice.items.filter(
                    (item) => item.id === product_id
                  )[0].quantity,
                  price: updatedInvoice.items.filter(
                    (item) => item.id === product_id
                  )[0].unitPrice,
                  final_price:
                    updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0].quantity *
                    updatedInvoice.items.filter(
                      (item) => item.id === product_id
                    )[0].unitPrice *
                    (1 -
                      (updatedInvoice.items.filter(
                        (item) => item.id === product_id
                      )[0].discount || 0) /
                        100),
                })
                .select();
              if (insertDiscountError)
                throw new Error(insertDiscountError.message);
            }
          }
        } else {
          console.warn(
            `Unexpected data type for products_id in caseProductId: ${caseProductId}`
          );
        }
      }

      const { error: updateCasesError } = await supabase
        .from("cases")
        .update({
          invoice_notes: updatedInvoice?.notes?.invoiceNotes,
          lab_notes: updatedInvoice?.notes?.labNotes,
        })
        .eq("id", updatedInvoice.caseId);

      if (updateCasesError) {
        throw new Error(updateCasesError.message);
      }

      const { error: updateInvoicesError } = await supabase
        .from("invoices")
        .update({
          amount: updatedInvoice.totalAmount,
        })
        .eq("case_id", updatedInvoice.caseId);

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
      (invoice) => invoice?.case?.caseStatus === "completed"
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
    dueDateFilter,
    statusFilter,
    caseFilter,
    invoices,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  };

  /* eslint-disable no-unused-vars */
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

    return [...data].sort((a, b) => {
      if (sortConfig.key === "date" || sortConfig.key === "dueDate") {
        const aDate = a[sortConfig.key];
        const bDate = b[sortConfig.key];
        if (aDate && bDate) {
          const dateA = new Date(aDate).getTime();
          const dateB = new Date(bDate).getTime();
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          return 0;
        }
      }

      if (sortConfig.key === "amount") {
        const numA = Number(a[sortConfig.key]) || 0;
        const numB = Number(b[sortConfig.key]) || 0;
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
      case "exportCSV":
        await new Promise((resolve) => setTimeout(resolve, 500));
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
              !selectedInvoices.includes(invoice.caseId as string)
          );
          setInvoices(remainingInvoices);
          setFilteredInvoices(remainingInvoices);
          setSelectedInvoices([]);
          break;
        case "markPaid":
          const paidInvoices = invoicesData.map((invoice: Invoice) => {
            if (selectedInvoices.includes(invoice.caseId as string)) {
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
            if (selectedInvoices.includes(invoice.caseId as string)) {
              return { ...invoice, status: "approved" as const };
            }
            return invoice;
          });
          setInvoices(updatedInvoices);
          setFilteredInvoices(updatedInvoices);
          setSelectedInvoices([]);
          break;
      }

      setProcessingFeedback("Processing completed successfully!");
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
              if (selectedInvoices.includes(invoice.caseId as string)) {
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
            if (invoice.caseId && selectedInvoices.includes(invoice.caseId)) {
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
            if (selectedInvoices.includes(invoice.caseId as string)) {
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
  const filterByDates = (invoices: Invoice[]) => {
    return invoices.filter((invoice) => {
      const matchesDate =
        !dateFilter ||
        (invoice.date &&
          format(new Date(invoice.date), "yyyy-MM-dd") ===
            format(dateFilter, "yyyy-MM-dd"));
      const matchesDueDate =
        !dueDateFilter ||
        (invoice.dueDate &&
          format(new Date(invoice.dueDate), "yyyy-MM-dd") ===
            format(dueDateFilter, "yyyy-MM-dd"));
      return matchesDate && matchesDueDate;
    });
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
          (invoice?.case?.caseId
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ??
            false)
      );
    }

    filtered = filterByDates(filtered);

    if (statusFilter.length > 0) {
      filtered = filtered.filter((invoice) =>
        statusFilter.includes(invoice.status)
      );
    }

    if (caseFilter) {
      filtered = filtered.filter(
        (invoice) => invoice.case?.caseId === caseFilter
      );
    }

    return filtered;
  };
  const getSortedAndPaginatedData = () => {
    const sortedData = sortData(invoicesData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
    return sortedData.slice(startIndex, endIndex);
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
  /* eslint-disable no-unused-vars */
  const handleDownload = (_id: string) => {
    console.log("download clciked");
  };
  /* eslint-disable no-unused-vars */
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

  return (
    <div className="space-y-4">
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
                    onClick={() => handleBulkAction("markPaid")}
                    className="flex items-center"
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    <span>Mark as Paid</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("exportPDF")}
                    className="flex items-center"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Export as PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("exportCSV")}
                    className="flex items-center"
                  >
                    <Table className="mr-2 h-4 w-4" />
                    <span>Export as CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("sendReminder")}
                    className="flex items-center"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Send Reminder</span>
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
                    <PopoverContent className="p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFilter}
                        onSelect={(date) => {
                          setDateFilter(date);
                          handleBulkAction("changeDueDate");
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <DropdownMenuItem
                    onClick={() => handleBulkAction("applyDiscount")}
                    className="flex items-center"
                  >
                    <PercentIcon className="mr-2 h-4 w-4" />
                    <span>Apply Discount</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("changePaymentTerms")}
                    className="flex items-center"
                  >
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span>Change Payment Terms</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canDeleteBulk && (
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("delete")}
                      className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            onChange={(e) => handleSearch(e)}
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
                        selectedInvoices.includes(invoice.caseId as string)
                      )
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedInvoices(
                          getSortedAndPaginatedData().map(
                            (invoice) => invoice.caseId as string
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
                          "approved",
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
                <TableHead
                  onClick={() => handleSort("caseId")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Case #{getSortIcon("caseId")}
                  </div>
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
                  <div className="flex items-center">
                    Due Date
                    {getSortIcon("dueDate")}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedAndPaginatedData().length === 0 ? (
                <EmptyState />
              ) : (
                getSortedAndPaginatedData().map((invoice, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      selectedInvoices.includes(invoice.caseId as string) &&
                        "bg-muted/50",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(
                          invoice.caseId as string
                        )}
                        onCheckedChange={() => {
                          if (
                            selectedInvoices.includes(invoice.caseId as string)
                          ) {
                            setSelectedInvoices((prev) =>
                              prev.filter(
                                (id) => id !== (invoice.caseId as string)
                              )
                            );
                          } else {
                            setSelectedInvoices((prev) => [
                              ...prev,
                              invoice.caseId as string,
                            ]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {invoice?.received_date
                        ? format(new Date(invoice?.received_date), "dd/MM/yy")
                        : "No Date"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        to={`/billing/${invoice.caseId as string}`}
                        className="text-primary hover:underline"
                      >
                        {(() => {
                          const caseNumber = invoice?.case_number ?? ""; // Default to an empty string if undefined
                          const parts = caseNumber.split("-");
                          parts[0] = "INV"; // Replace the first part
                          return parts.join("-");
                        })()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice?.invoicesData?.[0]?.status
                            ? (getStatusBadgeVariant(
                                invoice.invoicesData[0].status as
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
                                | "Appliance")
                            : "Bridge"
                        }
                      >
                        {invoice?.invoicesData?.[0]?.status
                          ? invoice.invoicesData[0].status
                              .charAt(0)
                              .toUpperCase() +
                            invoice.invoicesData[0].status.slice(1)
                          : "No Status"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {invoice?.client?.client_name || "Unknown Client"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {invoice.case_number}
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
                        <DropdownMenuContent align="end" className="w-[160px]">
                          {invoice.status === "draft" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApprove(invoice.caseId as string)
                                }
                                className="cursor-pointer text-primary focus:text-primary-foreground focus:bg-primary"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApproveAndPrint(
                                    invoice.caseId as string
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
                            onClick={() =>
                              navigate(`/billing/${invoice.caseId as string}`)
                            }
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
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
                            <DropdownMenuItem
                              onClick={() =>
                                handleOpenEditModal(invoice, "edit")
                              }
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                          )}
                          {["approved", "partially_paid", "completed"].includes(
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
                                handleOpenEditModal(invoice, "payment")
                              }
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleDownload(invoice.caseId as string)
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
                                  handleDelete(invoice.caseId as string)
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
                ))
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
              {loadingState.action === "sendReminder" && "Sending reminders..."}
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
          mode={editMode}
          onClose={handleCloseEditModal}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  );
};

export default InvoiceList;
