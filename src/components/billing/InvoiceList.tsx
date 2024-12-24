import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Clock, Eye, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreVertical, ChevronsUpDown, ChevronUp, ChevronDown, Calendar as CalendarIcon, Percent, Mail, Trash, Check, Loader2, X, Pencil } from 'lucide-react';
import { mockInvoices, Invoice } from '../../data/mockInvoicesData';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type SortConfig = {
  key: keyof Invoice;
  direction: 'asc' | 'desc';
};

type BulkAction = 'export' | 'delete' | 'markPaid' | 'sendReminder' | 'exportPDF' | 'exportCSV' | 'changeDueDate' | 'applyDiscount' | 'changePaymentTerms';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc'
  });
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null });
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('net30');
  const [loadingState, setLoadingState] = useState<LoadingState>({ action: null, isLoading: false });
  const [processingFeedback, setProcessingFeedback] = useState<string>('');
  const [selectionHighlight, setSelectionHighlight] = useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<Invoice['status'][]>([]);

  // Initialize invoices
  useEffect(() => {
    const initialInvoices = mockInvoices;
    setInvoices(initialInvoices);
    setFilteredInvoices(initialInvoices);
  }, []);

  // Update filtered invoices when search or date filters change
  useEffect(() => {
    const filtered = getFilteredInvoices();
    setFilteredInvoices(filtered);
  }, [searchTerm, dateFilter, dueDateFilter, statusFilter, invoices]);

  const handleNewInvoice = () => {
    navigate('/billing/new');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  };

  const getStatusBadgeVariant = (status: Invoice['status'], invoice: Invoice): string => {
    switch (status) {
      case 'draft':
        return 'draft';
      case 'pending':
        return 'pending';
      case 'paid':
        return 'success';
      case 'partially_paid':
        return 'warning';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'default';
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (key: keyof Invoice) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortData = (data: Invoice[]) => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      if (sortConfig.key === 'date' || sortConfig.key === 'dueDate') {
        const dateA = new Date(a[sortConfig.key]).getTime();
        const dateB = new Date(b[sortConfig.key]).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortConfig.key === 'amount' || sortConfig.key === 'balance') {
        const numA = Number(a[sortConfig.key]) || 0;
        const numB = Number(b[sortConfig.key]) || 0;
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      const valueA = String(a[sortConfig.key] || '').toLowerCase();
      const valueB = String(b[sortConfig.key] || '').toLowerCase();
      
      return sortConfig.direction === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  };

  const getSortIcon = (key: keyof Invoice) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" />
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const processBatch = async (
    invoiceBatch: string[],
    action: BulkAction,
    currentBatch: number,
    totalBatches: number
  ) => {
    const progress = Math.round((currentBatch / totalBatches) * 100);
    setLoadingState(prev => ({ ...prev, progress }));
    setProcessingFeedback(`Processing batch ${currentBatch} of ${totalBatches} (${progress}%)`);

    switch (action) {
      case 'exportPDF':
      case 'exportCSV':
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate export processing
        break;
      case 'delete':
      case 'markPaid':
      case 'sendReminder':
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API call
        break;
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (['changeDueDate', 'applyDiscount', 'changePaymentTerms'].includes(action)) {
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
        case 'delete':
          const remainingInvoices = invoices.filter(
            invoice => !selectedInvoices.includes(invoice.id)
          );
          setInvoices(remainingInvoices);
          setFilteredInvoices(remainingInvoices);
          setSelectedInvoices([]);
          break;
        case 'markPaid':
          const paidInvoices = invoices.map(invoice => {
            if (selectedInvoices.includes(invoice.id)) {
              return { ...invoice, status: 'paid' as const };
            }
            return invoice;
          });
          setInvoices(paidInvoices);
          setFilteredInvoices(paidInvoices);
          break;
      }

      setProcessingFeedback('Processing completed successfully!');
    } catch (error) {
      setProcessingFeedback('Error occurred during processing');
      console.error('Bulk action error:', error);
    } finally {
      setTimeout(() => {
        setLoadingState({ action: null, isLoading: false });
        setProcessingFeedback('');
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
        case 'changeDueDate':
          if (newDueDate) {
            const updatedInvoices = invoices.map(invoice => {
              if (selectedInvoices.includes(invoice.id)) {
                return { ...invoice, dueDate: newDueDate };
              }
              return invoice;
            });
            setInvoices(updatedInvoices);
            setFilteredInvoices(updatedInvoices);
          }
          break;
        case 'applyDiscount':
          const updatedInvoices = invoices.map(invoice => {
            if (selectedInvoices.includes(invoice.id)) {
              const discount = discountType === 'percentage' 
                ? invoice.totalAmount * (discountValue / 100)
                : discountValue;
              return { 
                ...invoice, 
                totalAmount: invoice.totalAmount - discount,
                discount: { type: discountType, value: discountValue }
              };
            }
            return invoice;
          });
          setInvoices(updatedInvoices);
          setFilteredInvoices(updatedInvoices);
          break;
        case 'changePaymentTerms':
          const updatedTermsInvoices = invoices.map(invoice => {
            if (selectedInvoices.includes(invoice.id)) {
              return { ...invoice, paymentTerms };
            }
            return invoice;
          });
          setInvoices(updatedTermsInvoices);
          setFilteredInvoices(updatedTermsInvoices);
          break;
      }

      setProcessingFeedback('Changes applied successfully!');
    } catch (error) {
      setProcessingFeedback('Error occurred while applying changes');
      console.error('Modal submit error:', error);
    } finally {
      setTimeout(() => {
        setLoadingState({ action: null, isLoading: false });
        setProcessingFeedback('');
        setModalState({ isOpen: false, type: null });
      }, 2000);
    }
  };

  const filterByDates = (invoices: Invoice[]) => {
    return invoices.filter(invoice => {
      const matchesDate = !dateFilter || format(new Date(invoice.date), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
      const matchesDueDate = !dueDateFilter || format(new Date(invoice.dueDate), 'yyyy-MM-dd') === format(dueDateFilter, 'yyyy-MM-dd');
      return matchesDate && matchesDueDate;
    });
  };

  const getFilteredInvoices = () => {
    let filtered = [...invoices];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply date filters
    filtered = filterByDates(filtered);

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(invoice => statusFilter.includes(invoice.status));
    }
    
    return filtered;
  };

  const getSortedAndPaginatedData = () => {
    const sortedData = sortData(filteredInvoices);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
    return sortedData.slice(startIndex, endIndex);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredInvoices.length);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const allStatuses: Invoice['status'][] = ['draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled'];

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={9} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-muted-foreground">No invoices found</p>
          <Button 
            variant="link" 
            onClick={() => navigate('/billing/create-invoice')}
            className="mt-2"
          >
            Create your first invoice
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {selectedInvoices.length > 0 ? (
            <>
              <span className="text-sm text-muted-foreground mr-2">
                {selectedInvoices.length} {selectedInvoices.length === 1 ? 'item' : 'items'} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export As
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('exportPDF')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('exportCSV')}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('changeDueDate')}
                disabled={loadingState.isLoading}
              >
                {loadingState.action === 'changeDueDate' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarIcon className="mr-2 h-4 w-4" />
                )}
                Change Due Date
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('applyDiscount')}
                disabled={loadingState.isLoading}
              >
                {loadingState.action === 'applyDiscount' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Percent className="mr-2 h-4 w-4" />
                )}
                Apply Discount
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('changePaymentTerms')}
                disabled={loadingState.isLoading}
              >
                {loadingState.action === 'changePaymentTerms' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Change Terms
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleBulkAction('delete')}
                disabled={loadingState.isLoading}
              >
                {loadingState.action === 'delete' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </>
          ) : null}
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      getSortedAndPaginatedData().length > 0 &&
                      getSortedAndPaginatedData().every(invoice => selectedInvoices.includes(invoice.id))
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedInvoices(prev => [...prev, ...getSortedAndPaginatedData().map(i => i.id)]);
                      } else {
                        setSelectedInvoices(prev => 
                          prev.filter(id => !getSortedAndPaginatedData().find(i => i.id === id))
                        );
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center hover:text-primary">
                        Date
                        {getSortIcon('date')}
                        {dateFilter && <X className="ml-2 h-4 w-4 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDateFilter(undefined); }} />}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center hover:text-primary">
                        Status
                        {getSortIcon('status')}
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
                        {allStatuses.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={statusFilter.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setStatusFilter(prev => [...prev, status]);
                                } else {
                                  setStatusFilter(prev => prev.filter(s => s !== status));
                                }
                              }}
                            />
                            <label
                              htmlFor={`status-${status}`}
                              className="flex items-center text-sm font-medium cursor-pointer"
                            >
                              <Badge variant={getStatusBadgeVariant(status, {} as Invoice)} className="ml-1">
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer whitespace-nowrap">
                  <div className="flex items-center">
                    Invoice #
                    {getSortIcon('invoiceNumber')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('patient')} className="cursor-pointer whitespace-nowrap">
                  <div className="flex items-center">
                    Patient
                    {getSortIcon('patient')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('client')} className="cursor-pointer whitespace-nowrap">
                  <div className="flex items-center">
                    Client
                    {getSortIcon('client')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('amount')} className="cursor-pointer text-right whitespace-nowrap">
                  <div className="flex items-center justify-end">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('balance')} className="cursor-pointer text-right whitespace-nowrap">
                  <div className="flex items-center justify-end">
                    Balance
                    {getSortIcon('balance')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center hover:text-primary">
                        Due Date
                        {getSortIcon('dueDate')}
                        {dueDateFilter && <X className="ml-2 h-4 w-4 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDueDateFilter(undefined); }} />}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDateFilter}
                        onSelect={setDueDateFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead className="w-[40px]" />
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
                            setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                          } else {
                            setSelectedInvoices(prev => [...prev, invoice.id]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(invoice.date), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status, invoice)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link 
                        to={`/billing/${invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.patient}</TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.client}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      ${invoice.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(invoice.dueDate), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem 
                            onClick={() => navigate(`/billing/${invoice.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/billing/${invoice.id}/edit`)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownload(invoice.id)}
                            className="cursor-pointer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(invoice.id)}
                            className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
              {loadingState.action === 'exportPDF' && 'Exporting as PDF...'}
              {loadingState.action === 'exportCSV' && 'Exporting as CSV...'}
              {loadingState.action === 'delete' && 'Deleting...'}
              {loadingState.action === 'markPaid' && 'Marking as paid...'}
              {loadingState.action === 'sendReminder' && 'Sending reminders...'}
              {loadingState.action === 'changeDueDate' && 'Changing due date...'}
              {loadingState.action === 'applyDiscount' && 'Applying discount...'}
              {loadingState.action === 'changePaymentTerms' && 'Changing payment terms...'}
              <br />
              {processingFeedback}
              <br />
              {loadingState.progress}% complete
            </div>
          </div>
        </div>
      )}

      <Dialog open={modalState.isOpen} onOpenChange={(open) => !open && setModalState({ isOpen: false, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalState.type === 'changeDueDate' && 'Change Due Date'}
              {modalState.type === 'applyDiscount' && 'Apply Discount'}
              {modalState.type === 'changePaymentTerms' && 'Change Payment Terms'}
            </DialogTitle>
          </DialogHeader>

          {modalState.type === 'changeDueDate' && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  New Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="col-span-3"
                  onChange={(e) => setNewDueDate(new Date(e.target.value))}
                />
              </div>
            </div>
          )}

          {modalState.type === 'applyDiscount' && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discountType" className="text-right">
                  Discount Type
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discountValue" className="text-right">
                  Value
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  className="col-span-3"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {modalState.type === 'changePaymentTerms' && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentTerms" className="text-right">
                  Payment Terms
                </Label>
                <Select
                  value={paymentTerms}
                  onValueChange={setPaymentTerms}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net30">Net 30</SelectItem>
                    <SelectItem value="net60">Net 60</SelectItem>
                    <SelectItem value="net90">Net 90</SelectItem>
                    <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalState({ isOpen: false, type: null })}>
              Cancel
            </Button>
            <Button onClick={handleModalSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceList;