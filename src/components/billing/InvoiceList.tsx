import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Clock,
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
  Percent,
  Trash,
  Loader2,
  X,
  Pencil,
  MoreHorizontal,
  Check,
  Printer,
  Banknote,
  FileText,
  Table,
  Bell,
  Calendar,
  Percent as PercentIcon,
  Clock as ClockIcon,
  Trash2,
  CheckCircle,
  Printer as PrinterIcon,
} from "lucide-react";
import { mockInvoices, Invoice } from "../../data/mockInvoicesData";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { EditInvoiceModal } from "./EditInvoiceModal";
import { toast } from "react-hot-toast";

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

const BATCH_SIZE = 50; // Process 50 items at a time

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<Invoice["status"][]>([]);
  const [caseFilter, setCaseFilter] = useState<string>("");

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editMode, setEditMode] = useState<"edit" | "payment">("edit");

  const handleOpenEditModal = (invoice: Invoice, mode: "edit" | "payment" = "edit") => {
    // Delay setting the invoice to avoid focus issues
    setTimeout(() => {
      setEditingInvoice(invoice);
      setEditMode(mode);
    }, 0);
  };

  const handleCloseEditModal = () => {
    // Delay cleanup to avoid focus issues
    setTimeout(() => {
      setEditingInvoice(null);
      setEditMode("edit");
    }, 0);
  };

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    try {
      setLoadingState({ isLoading: true, action: "save" });
      // TODO: API call to save invoice
      console.log("Saving invoice:", updatedInvoice);
      
      // Show success message
      toast.success("Invoice updated successfully");
      
      // Close modal and reset state
      handleCloseEditModal();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setLoadingState({ isLoading: false, action: null });
    }
  };

  // Cleanup function for modal state
  useEffect(() => {
    return () => {
      setEditingInvoice(null);
      setEditMode("edit");
    };
  }, []);

  // Focus management
  useEffect(() => {
    let lastActiveElement: HTMLElement | null = null;
    
    if (editingInvoice) {
      lastActiveElement = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (lastActiveElement && 'focus' in lastActiveElement) {
        lastActiveElement.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      if (lastActiveElement && 'focus' in lastActiveElement) {
        lastActiveElement.focus();
      }
    };
  }, [editingInvoice]);

  // Initialize invoices
  useEffect(() => {
    // Filter for completed cases only
    const completedCaseInvoices = mockInvoices.filter(
      (invoice) => invoice.case.caseStatus === "completed"
    );
    setInvoices(completedCaseInvoices);
    setFilteredInvoices(completedCaseInvoices);
  }, []);

  // Update filtered invoices when search or date filters change
  useEffect(() => {
    const filtered = getFilteredInvoices();
    setFilteredInvoices(filtered);
  }, [searchTerm, dateFilter, dueDateFilter, statusFilter, caseFilter, invoices]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  };

  const getStatusBadgeVariant = (status: Invoice["status"]): string => {
    switch (status) {
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
        const dateA = new Date(a[sortConfig.key]).getTime();
        const dateB = new Date(b[sortConfig.key]).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
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
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate export processing
        break;
      case "delete":
      case "markPaid":
      case "sendReminder":
        await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate API call
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
          const remainingInvoices = invoices.filter(
            (invoice) => !selectedInvoices.includes(invoice.id)
          );
          setInvoices(remainingInvoices);
          setFilteredInvoices(remainingInvoices);
          setSelectedInvoices([]);
          break;
        case "markPaid":
          const paidInvoices = invoices.map((invoice) => {
            if (selectedInvoices.includes(invoice.id)) {
              return { ...invoice, status: "paid" as const };
            }
            return invoice;
          });
          setInvoices(paidInvoices);
          setFilteredInvoices(paidInvoices);
          break;
        case "approve":
        case "approvePrint":
          const updatedInvoices = invoices.map((invoice) => {
            if (selectedInvoices.includes(invoice.id)) {
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

      // Apply changes after all batches are processed
      switch (action) {
        case "changeDueDate":
          if (newDueDate) {
            const updatedInvoices = invoices.map((invoice) => {
              if (selectedInvoices.includes(invoice.id)) {
                return { ...invoice, dueDate: newDueDate as unknown as string };
              }
              return invoice;
            });
            console.log(updatedInvoices, "updatedInvoices");
            setInvoices(updatedInvoices);
            setFilteredInvoices(updatedInvoices);
          }
          break;
        case "applyDiscount":
          const updatedInvoices = invoices.map((invoice) => {
            if (selectedInvoices.includes(invoice.id)) {
              const discount =
                discountType === "percentage"
                  ? invoice.totalAmount * (discountValue / 100)
                  : discountValue;
              return {
                ...invoice,
                totalAmount: invoice.totalAmount - discount,
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
            if (selectedInvoices.includes(invoice.id)) {
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
        format(new Date(invoice.date), "yyyy-MM-dd") ===
          format(dateFilter, "yyyy-MM-dd");
      const matchesDueDate =
        !dueDateFilter ||
        format(new Date(invoice.dueDate), "yyyy-MM-dd") ===
          format(dueDateFilter, "yyyy-MM-dd");
      return matchesDate && matchesDueDate;
    });
  };

  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.case.caseId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filters
    filtered = filterByDates(filtered);

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((invoice) =>
        statusFilter.includes(invoice.status)
      );
    }

    // Apply case filter
    if (caseFilter) {
      filtered = filtered.filter(
        (invoice) => invoice.case.caseId === caseFilter
      );
    }

    return filtered;
  };

  const getSortedAndPaginatedData = () => {
    const sortedData = sortData(filteredInvoices);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
    return sortedData.slice(startIndex, endIndex);
  };

  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const endIndex = Math.min(startIndex + itemsPerPage, filteredInvoices.length);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const allStatuses: Invoice["status"][] = [
    "draft",
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
    updateInvoice(id, { status: 'approved' });
  };

  const handleApproveAndPrint = async (id: string) => {
    await updateInvoice(id, { status: 'approved' });
    handleDownload(id);
  };

  const canApproveBulk = selectedInvoices.length > 0 && 
    selectedInvoices.every(id => {
      const invoice = invoices.find(inv => inv.id === id);
      return invoice?.status === 'draft';
    });

  const canDeleteBulk = selectedInvoices.length > 0 && 
    selectedInvoices.every(id => {
      const invoice = invoices.find(inv => inv.id === id);
      return ['draft', 'overdue'].includes(invoice?.status || '');
    });

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
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
                        selectedInvoices.includes(invoice.id)
                      )
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedInvoices(
                          getSortedAndPaginatedData().map(
                            (invoice) => invoice.id
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
                    Invoice #
                    {getSortIcon("invoiceNumber")}
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
                          <span className="text-sm font-medium">Filter by Status</span>
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
                          "draft",
                          "approved",
                          "paid",
                          "partially_paid",
                          "overdue",
                          "cancelled",
                        ].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={statusFilter.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setStatusFilter((prev) => [...prev, status]);
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
                              <Badge variant={getStatusBadgeVariant(status as Invoice["status"])}>
                                {status === "partially_paid"
                                  ? "Partially Paid"
                                  : status.charAt(0).toUpperCase() + status.slice(1)}
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
                  onClick={() => handleSort("case.caseId")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Case #
                    {getSortIcon("case.caseId")}
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
                getSortedAndPaginatedData().map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className={cn(
                      selectedInvoices.includes(invoice.id) && "bg-muted/50",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={() => {
                          if (selectedInvoices.includes(invoice.id)) {
                            setSelectedInvoices((prev) =>
                              prev.filter((id) => id !== invoice.id)
                            );
                          } else {
                            setSelectedInvoices((prev) => [
                              ...prev,
                              invoice.id,
                            ]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(invoice.date), "dd/MM/yy")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        to={`/billing/${invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(
                          invoice.status
                        )}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {invoice.clientName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {invoice.case.caseId}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      $
                      {invoice.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(invoice.dueDate), "dd/MM/yy")}
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
                          {invoice.status === 'draft' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleApprove(invoice.id)}
                                className="cursor-pointer text-primary focus:text-primary-foreground focus:bg-primary"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleApproveAndPrint(invoice.id)}
                                className="cursor-pointer text-primary focus:text-primary-foreground focus:bg-primary"
                              >
                                <PrinterIcon className="mr-2 h-4 w-4" />
                                Approve + Print
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => navigate(`/billing/${invoice.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {['draft', 'overdue'].includes(invoice.status) && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(invoice, "edit")}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                          )}
                          {['approved', 'partially_paid'].includes(invoice.status) && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(invoice, "payment")}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDownload(invoice.id)}
                            className="cursor-pointer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {['draft', 'overdue'].includes(invoice.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(invoice.id)}
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
              {loadingState.action === "approvePrint" && "Approving and printing..."}
              <br />
              {processingFeedback}
              <br />
              {loadingState.progress}% complete
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
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
