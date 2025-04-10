import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown, ChevronUp, Eye, Filter, MoreVertical, PrinterIcon, Search, X } from "lucide-react";
import { Adjustment } from "@/pages/billing/Adjustments";
import { formatDate } from "@/lib/formatedDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import AdjustmentReceiptPreviewModal from "./print/AdjustmentReceiptPreviewModal";
import { labDetail } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { DateRangePicker } from "../ui/date-range-picker";
import { format } from "date-fns-tz/format";
import { useQuery } from '@supabase-cache-helpers/postgrest-swr';
import { DateRange } from "react-day-picker";

type SortConfig = {
  key: keyof Adjustment;
  direction: "asc" | "desc";
};

// Client interface following the standardized pattern across the application
interface Client {
  id: string;
  accountNumber: string;
  clientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
}


// Mock data for development
const mockAdjustments = [
  {
    id: "1",
    date: new Date("2024-03-01"),
    client: "Doctor, Test",
    description: "test",
    creditAmount: 200.0,
    debitAmount: 0,
  },
  {
    id: "2",
    date: new Date("2023-12-19"),
    client: "Test Client",
    description: "test credit",
    creditAmount: 200.0,
    debitAmount: 320.0,
  },
];

const AdjustmentList = ({ adjustments }: { adjustments: Adjustment[] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedAdjustments, setSelectedAdjustments] = useState<string[]>([]);

  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [labs, setLabs] = useState<labDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const [paymentDateRange, setPaymentDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredAdjustments, setFilteredAdjustments] = useState<Adjustment[]>([]);

  const totalPages = Math.ceil(adjustments.length / itemsPerPage);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "payment_date",
    direction: "desc",
  });


  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleSelectsAdjustment = (adjustmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAdjustments([...selectedAdjustments, adjustmentId]);
    } else {
      setSelectedAdjustments(
        selectedAdjustments.filter((id) => id !== adjustmentId)
      );
    }
  };

  const handleSelectAdjustment = (adjustmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAdjustments([adjustmentId]);
    } else {
      setSelectedAdjustments([]);
    }
  };

  const handleSelectAllAdjustment = (checked: boolean) => {
    if (checked) {
      setSelectedAdjustments(adjustments.map((adjust) => adjust.id.toString()));
    } else {
      setSelectedAdjustments([]);
    }
  };

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            `
             lab:labs!lab_id (
              id,
              name,
              attachements,
              office_address_id,
              office_address:office_address!office_address_id (            
                email,             
                phone_number,
                address_1,
                address_2,
                city,
                state_province,
                zip_postal,
                country
              )
             )
            `
          )
          .eq("id", user?.id)
          .or("is_archive.is.null,is_archive.eq.false");

        if (error) {
          throw new Error(error.message);
        }

        // Assuming you want the first lab's details
        if (data && data.length > 0) {
          const labData = data[0].lab;
          setLabs(labData as any);
        }
      } catch (err: any) {
        console.error("Error fetching labs data:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLabs();
    }
  }, [user?.id]);

  console.log(adjustments, "adjustmentsadjustments");

  const handleSort = (key: keyof Adjustment) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }));
  };


  const getSortIcon = (key: keyof Adjustment) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  const sortData = (data: Adjustment[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a: Adjustment, b: Adjustment) => {
      const { key, direction } = sortConfig;

      // Sort by payment_date (date comparison)
      if (key === "payment_date") {
        const dateA = new Date(a.payment_date || 0).getTime();
        const dateB = new Date(b.payment_date || 0).getTime();
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Special case: sort by nested client.client_name
      if (key === "client") {
        const aName = a.client?.client_name?.toLowerCase() ?? "";
        const bName = b.client?.client_name?.toLowerCase() ?? "";
        return direction === "asc"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }

      // Generic string or number comparison
      const aVal = a[key] ?? "";
      const bVal = b[key] ?? "";

      // Handle numbers (e.g., credit_amount, debit_amount)
      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return direction === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  };

  const processedAdjustments = useMemo(() => {
   if (!adjustments) return [];
  
    let filtered = adjustments;
  
    if (paymentDateRange?.from && paymentDateRange?.to) {
      filtered = adjustments.filter((adjustment) => {
        const paymentDate = new Date(adjustment.payment_date);
        const paymentDateOnly = new Date(paymentDate.setHours(0, 0, 0, 0));
        const fromDateOnly = new Date(paymentDateRange.from!.setHours(0, 0, 0, 0));
        const toDateOnly = new Date(paymentDateRange.to!.setHours(23, 59, 59, 999));
        return paymentDateOnly >= fromDateOnly && paymentDateOnly <= toDateOnly;
      });
    }
  
     // Filter by selectedClient
  if (selectedClient) {
    filtered = filtered.filter(
      (adjustment) => adjustment.client?.client_name === selectedClient.clientName
    );
  }
    // Return sorted data if sortConfig exists, otherwise return filtered
    return sortConfig ? sortData(filtered) : filtered;
  
  }, [adjustments, paymentDateRange, selectedClient, sortConfig]);
  
  

  // First, get the lab_id of the logged-in user
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

  // Use the useQuery hook to fetch all clients for the current lab (for dropdown)
  const { data: clientsData, error: clientsError } = useQuery(
    labIdData?.lab_id
      ? supabase
        .from('clients')
        .select('id, client_name, account_number, phone, street, city, state, zip_code')
        .eq("lab_id", labIdData?.lab_id)
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Process clients data when it changes
  useEffect(() => {
    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return;
    }

    if (clientsData) {
      console.log('Raw client data from Supabase:', clientsData);
      processClientData(clientsData);
    }
  }, [clientsData, clientsError]);


  // Filtered clients based on search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return clients;

    return clients.filter(client =>
      client.clientName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.clientName.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);


  // Process client data from useQuery hook
  const processClientData = (data: any[]) => {
    try {
      // Transform to match the standardized client interface
      const transformedClients: Client[] = data.map(client => ({
        id: client.id,
        clientName: client.client_name || '',
        accountNumber: client.account_number || '',
        phone: client.phone || '',
        street: client.street || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zip_code || ''
      }));

      setClients(transformedClients);
    } catch (error) {
      console.error('Error processing client data:', error);
    }
  };


  const handleClientSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClientSearchKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSearchTerm(e.target.value);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    //applyFilters(searchTerm, client);
  };


  const clearClientFilter = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    //applyFilters(searchTerm, null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term === '') {
      // If search term is empty, apply only client filter if any
      //applyFilters('', selectedClient);
      return;
    }

    // Apply both search term and client filter
    //applyFilters(term, selectedClient);
  };

  const applyFilters = (term: string, client: Client | null) => {
    let filtered = [...adjustments];

    // // Apply search term filter
    // if (term) {
    //   filtered = filtered.filter(adjustment =>
    //     adjustment.toLowerCase().includes(term.toLowerCase()) ||
    //     shipment.clientName.toLowerCase().includes(term.toLowerCase()) ||
    //     shipment.patientName.toLowerCase().includes(term.toLowerCase()) ||
    //     (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(term.toLowerCase()))
    //   );
    // }

    // Apply client filter
    // if (client) {
    //   filtered = filtered.filter(adjustments =>
    //     adjustments.client === client
    //   );
    // }

    // setFilteredShipments(filtered);
  };

  const getSortedAndPaginatedData = () => {
    const data = searchTerm
      ? processedAdjustments.filter((adjustment) =>
          adjustment.client?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : processedAdjustments;
  
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

   const EmptyState = () => (
      <TableRow>
        <TableCell colSpan={9} className="h-24 text-center">
          <div className="flex flex-col items-center justify-center">
            <p className="text-muted-foreground">No Adjustment found</p>
          </div>
        </TableCell>
      </TableRow>
    );


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center">
          {/* {selectedAdjustments && selectedAdjustments.length > 0 && ( */}
          <>
            <span className="text-sm text-muted-foreground mr-2">
              {selectedAdjustments.length}{" "}
              {selectedAdjustments.length === 1 ? "item" : "items"} selected
            </span>

            {/* <Button
              variant="default"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Invoices
            </Button> */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              disabled={selectedAdjustments.length === 0}
              className={selectedAdjustments.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Memos
            </Button>
          </>
          {/* )} */}
        </div>

        <div className="flex items-center gap-4">

          {/* Calendar Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={paymentDateRange ? "default" : "outline"}
                className="mr-2 h-8"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {paymentDateRange
                  ? `${paymentDateRange.from ? format(paymentDateRange.from, "LLL dd, y") : ""} - ${paymentDateRange.to ? format(paymentDateRange.to, "LLL dd, y") : ""}`
                  : "Select Custom Date"}
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
              <div>
                <DateRangePicker
                  dateRange={paymentDateRange}
                  onDateRangeChange={setPaymentDateRange}
                />
              </div>
            </PopoverContent>
          </Popover>


          <div className="flex items-center justify-end space-x-2 px-2">
            {/* Client Filter Dropdown following standardized pattern */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedClient ? `Client: ${selectedClient.clientName}` : 'Filter by Client'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px] p-2 bg-white shadow-lg border border-gray-200 " align="start">
                <div
                  className="sticky top-0 z-10 bg-background p-2 border-b"
                  onClick={handleClientSearchClick}
                  onKeyDown={handleClientSearchKeyDown}
                >
                  <Input
                    placeholder="Search clients..."
                    value={clientSearchTerm}
                    onChange={handleClientSearchChange}
                    className="w-full"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <DropdownMenuItem
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="flex flex-col items-start py-2"
                      >
                        <div className="font-medium">{client.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          Account: {client.accountNumber}
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No clients found
                    </div>
                  )}
                </div>
                {selectedClient && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearClientFilter} className="justify-center text-red-500">
                      Clear Filter
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedClient && (
              <Button variant="ghost" size="sm" onClick={clearClientFilter} className="h-8 px-2">
                <span className="sr-only">Clear filter</span>
                ✕
              </Button>
            )}
          </div>

          <div className="relative">
            <Input
              placeholder="Search adjustments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  // checked={
                  //   adjustments.length > 0 &&
                  //   selectedAdjustments.length === adjustments.length
                  // }
                  checked={
                    getSortedAndPaginatedData().length > 0 &&
                    getSortedAndPaginatedData().every((adjust) =>
                      selectedAdjustments.includes(adjust.id.toString())
                    )
                  }

                  // onCheckedChange={handleSelectAllAdjustment}

                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAdjustments(
                        getSortedAndPaginatedData().map(
                          (adjust) => adjust.id.toString()
                        )
                      );
                    } else {
                      setSelectedAdjustments([]);
                    }
                  }}

                  aria-label="Select all"
                />
              </TableHead>
              {/* <TableHead>Date</TableHead> */}
              <TableHead
                onClick={() => handleSort("payment_date")}
                className="cursor-pointer whitespace-nowrap"
              >
                <div className="flex items-center">
                  Date
                  {getSortIcon("payment_date")}
                </div>
              </TableHead>
              {/* <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Credit Amount</TableHead>
              <TableHead className="text-right">Debit Amount</TableHead> */}
              <TableHead onClick={() => handleSort("client")} className="cursor-pointer">
                <div className="flex items-center">
                  Client
                  {getSortIcon("client")}
                </div>
              </TableHead>

              <TableHead onClick={() => handleSort("description")} className="cursor-pointer">
                <div className="flex items-center">
                  Description
                  {getSortIcon("description")}
                </div>
              </TableHead>

              <TableHead onClick={() => handleSort("credit_amount")} className="cursor-pointer">
                <div className="flex items-center">
                  Credit Amount
                  {getSortIcon("credit_amount")}
                </div>
              </TableHead>

              <TableHead onClick={() => handleSort("debit_amount")} className="cursor-pointer">
                <div className="flex items-center">
                  Debit Amount
                  {getSortIcon("debit_amount")}
                </div>
              </TableHead>

              <TableHead className="w-[30px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : getSortedAndPaginatedData().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              getSortedAndPaginatedData().map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAdjustments.includes(adjustment?.id.toString())}
                      onCheckedChange={(checked) =>
                        handleSelectsAdjustment(adjustment?.id.toString(), checked as boolean)
                      }
                      aria-label={`Select adjustment ${adjustment?.id.toString()}`}
                    />
                  </TableCell>
                  <TableCell>{formatDate(adjustment.payment_date)}</TableCell>
                  <TableCell>{adjustment.client.client_name}</TableCell>
                  <TableCell>{adjustment.description}</TableCell>
                  <TableCell className="text-right">
                    {adjustment?.credit_amount != null && adjustment.credit_amount > 0
                      ? `$${(adjustment.credit_amount || 0).toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {adjustment.debit_amount && adjustment?.debit_amount > 0
                      ? `$${adjustment.debit_amount.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="flex space-x-4 bg-gray-50 p-2 rounded-md"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            handleSelectAdjustment(adjustment.id.toString(), true);
                            setIsPreviewModalOpen(true);
                          }}
                          className="cursor-pointer p-2 rounded-md hover:bg-gray-300"
                          style={{ display: "flex", flexDirection: "row" }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
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

      {/* <div className="flex items-center justify-between">
        <Select defaultValue="20">
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">1-2 of 2</div>
      </div> */}

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


      {isPreviewModalOpen && (
        <AdjustmentReceiptPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
          }}
          caseDetails={(() => {
            const filteredData = adjustments.filter((adjust: any) =>
              selectedAdjustments.includes(adjust.id.toString())
            );
            return filteredData;
          })()}
          labData={labs}
        />
      )}
    </div>
  );
};

export default AdjustmentList;
