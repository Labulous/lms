import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@supabase-cache-helpers/postgrest-swr';
import { useAuth } from '@/contexts/AuthContext';
import { getLabIdByUserId } from '@/services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Truck, ChevronsUpDown, MoreHorizontal, Eye, Pencil, Filter, PrinterIcon, Printer, FileText } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import InvoicePreviewModal from '../invoices/InvoicePreviewModal';

// Define interfaces for the data structure returned from Supabase
interface ClientData {
  id: string;
  client_name: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  account_number?: string;
}

interface CaseData {
  id: string;
  rx_number: string;
  patient_name: string;
  due_date?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client: ClientData[] | null;
}

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

// Define the Shipment interface based on the data we'll get from Supabase
interface Shipment {
  id: string;
  caseId: string; // This will be rx_number from cases table
  clientName: string;
  clientAddress: string;
  city: string;
  patientName: string;
  shippingProvider: string;
  trackingNumber: string;
  shipmentDate: string;
  expectedDeliveryDate: string;
  status: string;
  notes: string;
  clientId: string;
  clientAccountNumber: string;
  delivery: string;
}

const ShippingList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageSize, setPageSize] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] =
    useState<any>(null);

  const pagination = useMemo(
    () => ({
      pageIndex: paginationState.pageIndex,
      pageSize: pageSize,
    }),
    [paginationState, pageSize]
  );

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

  // Then use the lab_id to filter cases
  const { data: casesData, error: casesError } = useQuery(
    labIdData?.lab_id
      ? supabase
        .from('cases')
        .select(`
            id,
            case_number,
            patient_name,
            due_date,
            status,
            received_date,
            ship_date,
            client_id
          `)
        .eq("lab_id", labIdData?.lab_id)
        .in('status', ['completed', 'shipped'])
      : null,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Separately fetch client data for all cases
  const { data: caseClientData, error: caseClientError } = useQuery(
    casesData && casesData.length > 0
      ? supabase
        .from('clients')
        .select('*')
        .in('id', casesData.map(c => c.client_id).filter(Boolean))
      : null,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
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

  // Handle lab data loading and errors
  useEffect(() => {
    if (labError) {
      console.error('Error fetching lab data:', labError);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [labError]);

  // Process cases data when it changes
  useEffect(() => {
    if (casesError) {
      console.error('Error fetching shipping data:', casesError);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (caseClientError) {
      console.error('Error fetching client data:', caseClientError);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (casesData && caseClientData) {
      console.log('Raw data from Supabase:', casesData);
      console.log('Client data from Supabase:', caseClientData);
      processShippingData(casesData, caseClientData);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [casesData, casesError, caseClientData, caseClientError]);

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
      client.accountNumber.toLowerCase().includes(clientSearchTerm.toLowerCase())
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

  // Process shipping data from useQuery hook
  const processShippingData = (casesData: any[], clientsData: any[]) => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      // Make sure data is an array before mapping
      const cases = Array.isArray(casesData) ? casesData : [];
      const clients = Array.isArray(clientsData) ? clientsData : [];

      console.log('Cases data array length:', cases.length);
      console.log('Clients data array length:', clients.length);

      if (cases.length === 0) {
        console.log('No cases found with status completed or shipped');
        // Return early if no data to avoid further processing
        setShipments([]);
        setFilteredShipments([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Create a map of client IDs to client data for quick lookup
      const clientMap = clients.reduce((map, client) => {
        map[client.id] = client;
        return map;
      }, {});

      console.log('Client map:', clientMap);

      const transformedData: Shipment[] = cases.map(item => {
        let city = 'N/A';
        let clientAddress = 'N/A';
        let deliveryMethod = 'Local';
        let clientName = 'Unknown Client';

        // Get client data from the clientMap using the client_id
        const clientData = item.client_id ? clientMap[item.client_id] : null;

        console.log('Processing case:', item.id, 'Client ID:', item.client_id, 'Client data:', clientData);

        if (clientData) {
          clientName = clientData.client_name || 'Unknown Client';
          city = clientData.city || 'N/A';
          clientAddress = `${clientData.street || ''}, ${clientData.city || ''}, ${clientData.state || ''} ${clientData.zip_code || ''}`;
          // Determine delivery method based on client location or preferences
          deliveryMethod = clientData.state && clientData.state.trim() ? 'Shipping' : 'Local';
          console.log('Client name set to:', clientName, 'Delivery method:', deliveryMethod);
        }

        return {
          id: item.id,
          caseId: item.case_number,
          clientName: clientName,
          clientAddress: clientAddress,
          city: city,
          patientName: item.patient_name,
          shippingProvider: deliveryMethod,
          trackingNumber: 'N/A',
          shipmentDate: item.ship_date ? format(new Date(item.ship_date), 'yyyy-MM-dd') : 'N/A',
          expectedDeliveryDate: item.due_date ? format(new Date(item.due_date), 'yyyy-MM-dd') : 'TBD',
          status: item.status === 'completed' ? 'Not Shipped' : 'Shipped',
          notes: '',
          clientId: clientData ? clientData.id : '',
          clientAccountNumber: clientData && clientData.account_number ? clientData.account_number : '',
          delivery: deliveryMethod,
        };
      });

      console.log('Transformed shipment data:', transformedData);
      setShipments(transformedData);

      // Apply existing filters to the new data
      let filtered = transformedData;

      if (selectedClient) {
        filtered = filtered.filter(shipment => shipment.clientId === selectedClient.id);
        console.log('After client filter:', filtered.length);
      }

      if (searchTerm) {
        filtered = filtered.filter(shipment =>
          shipment.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        console.log('After search term filter:', filtered.length);
      }

      setFilteredShipments(filtered);
      console.log('Final filtered shipments set:', filtered.length);
    } catch (error) {
      console.error('Error processing shipping data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Function to manually refresh data
  const refreshData = () => {
    setIsRefreshing(true);
    // The useQuery hook will automatically refresh when we call mutate()
    // but we don't need to do anything special here as the useEffect hooks
    // will process the new data when it arrives
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term === '') {
      // If search term is empty, apply only client filter if any
      applyFilters('', selectedClient);
      return;
    }

    // Apply both search term and client filter
    applyFilters(term, selectedClient);
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
    applyFilters(searchTerm, client);
  };

  const clearClientFilter = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    applyFilters(searchTerm, null);
  };

  const applyFilters = (term: string, client: Client | null) => {
    let filtered = [...shipments];

    // Apply search term filter
    if (term) {
      filtered = filtered.filter(shipment =>
        shipment.caseId.toLowerCase().includes(term.toLowerCase()) ||
        shipment.clientName.toLowerCase().includes(term.toLowerCase()) ||
        shipment.patientName.toLowerCase().includes(term.toLowerCase()) ||
        (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(term.toLowerCase()))
      );
    }

    // Apply client filter
    if (client) {
      filtered = filtered.filter(shipment =>
        shipment.clientId === client.id
      );
    }

    setFilteredShipments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Shipped':
        return 'bg-yellow-500 text-yellow-500 hover:bg-yellow-500 bg-opacity-10 hover:bg-opacity-10 hover:text-inherit';
      case 'Shipped':
        return 'bg-green-500 text-green-500 hover:bg-green-500 bg-opacity-10 hover:bg-opacity-10 hover:text-inherit';
      default:
        return 'bg-gray-500 text-gray-500 hover:bg-gray-500 bg-opacity-10 hover:bg-opacity-10 hover:text-inherit';
    }
  };

  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "caseId",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Case #
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          to={`/cases/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("caseId")}
        </Link>
      ),
    },
    {
      accessorKey: "patientName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Patient Name
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("patientName")}</div>,
    },
    {
      accessorKey: "city",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          City
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("city")}</div>,
    },
    {
      accessorKey: "delivery",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Delivery
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.delivery || 'Local'}</div>,
    },
    {
      accessorKey: "clientName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Client
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("clientName")}</div>,
    },
    {
      accessorKey: "expectedDeliveryDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Due Date
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dueDate = row.getValue("expectedDeliveryDate") as string;
        return <div>{dueDate === "TBD" ? "TBD" : dueDate}</div>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Shipping Status
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status === "Delivered" ? "Completed" : status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/cases/${row.original.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                 onClick={() => navigate(`/cases/update/?caseId=${row.original.id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Debug the data being passed to the table
  useEffect(() => {
    if (filteredShipments.length > 0) {
      console.log('Table data sample (first item):', filteredShipments[0]);
      console.log('Total filtered shipments:', filteredShipments.length);
    } else {
      console.log('No filtered shipments available');
    }
  }, [filteredShipments]);

  const table = useReactTable({
    data: filteredShipments,
    columns,
    pageCount: Math.ceil(filteredShipments.length / pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: paginationState.pageIndex, pageSize },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Debug the table model
    debugTable: true,
  });

  // Debug info about data state
  useEffect(() => {
    console.log('Current shipments state:', shipments.length);
    console.log('Current filteredShipments state:', filteredShipments.length);
  }, [shipments, filteredShipments]);

  const handlePrintOptionSelect = (option: string, selectedId?: string[]) => {
    const selectedCases = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    // if (selectedCases.length === 0 && !selectedId) return;
    // console.log(selectedCases, "selectedCases");
    // const previewState = {
    //   type: option,
    //   paperSize: "LETTER", 
    //   caseData: {},
    //   caseDetails: cases.filter((item) =>
    //     selectedId && selectedId.length > 0
    //       ? selectedId.includes(item.id)
    //       : selectedCasesIds.includes(item.id)
    //   ),
    // };
    // console.log(
    //   cases.filter((item) =>
    //     selectedId && selectedId.length > 0
    //       ? selectedId.includes(item.id)
    //       : selectedCasesIds.includes(item.id)
    //   ),
    //   "hi"
    // );
    // // Use a fixed storage key so that the data always overrides the previous entry.
    // const storageKey = "printData";
    // localStorage.setItem(storageKey, JSON.stringify(previewState));
    // // Store data in localStorage

    // // Open the print preview page
    // window.open(`${window.location.origin}/print-preview`, "_blank");
  };

  const handleMarkShipped = async () => {
    const selectedCases = table.getSelectedRowModel().rows.map((row) => row.original.id);
  
    if (!selectedCases.length) {
      alert("Please select at least one case to mark as shipped.");
      return;
    }
  
    const confirmShipped = window.confirm(
      `Are you sure you want to mark ${selectedCases.length} ${selectedCases.length === 1 ? "case" : "cases"} as shipped?`
    );
  
    if (!confirmShipped) return;
  
    try {
      setIsLoading(true); // Indicate loading state
  
      const { error } = await supabase
        .from("cases")
        .update({ status: "shipped" })
        .in("id", selectedCases);
  
      if (error) throw error;
  
      alert("Selected cases have been marked as shipped.");
  
      // Refresh the shipping data after updating
      await fetchShippingData();
    } catch (error) {
      console.error("Error updating case status:", error);
      alert("Failed to update case status. Please try again.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };
  
  const fetchShippingData = async () => {
    debugger;
    try {
      setIsLoading(true);
      
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .in("status", ["completed", "shipped"]) 
        .eq("lab_id", labIdData?.lab_id);
  
      if (casesError) throw casesError;
  
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("lab_id", labIdData?.lab_id);
  
      if (clientsError) throw clientsError;
  
      // Update table data
      processShippingData(casesData, clientsData);
    } catch (error) {
      console.error("Error fetching shipping data:", error);
      alert("Failed to refresh table data.");
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Shipping Management"
        description="Manage and track all your shipments"
      />


      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {/* {table.getSelectedRowModel().rows.length > 0 && (
              <><span className="text-sm text-muted-foreground mr-2">
                {table.getSelectedRowModel().rows.length}{" "}
                {table.getSelectedRowModel().rows.length === 1 ? "shipment" : "shipments"}{" "}
                selected
              </span><Button
                variant="default"
                size="sm"
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={table.getSelectedRowModel().rows.length === 0}
                className={table.getSelectedRowModel().rows.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print Options
                </Button></>
            )} */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                {table.getSelectedRowModel().rows.length || 0}{" "}
                {table.getSelectedRowModel().rows.length === 1 ? "shipment" : "shipments"} selected
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewModalOpen(true)}
                    disabled={table.getSelectedRowModel().rows.length === 0}
                    className={table.getSelectedRowModel().rows.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <PrinterIcon className="mr-2 h-4 w-4" />
                    Print Options
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handlePrintOptionSelect("lab-slip")}>
                    <Printer className="h-4 w-4 mr-2" />
                    Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkShipped()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Mark as Shipped
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>



          </div>
          <div className="flex items-center justify-end space-x-2 px-2">
            {/* Client Filter Dropdown following standardized pattern */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedClient ? `Client: ${selectedClient.clientName}` : 'Filter by Client'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]" align="start">
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

            <div className="relative w-full md:w-60">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap bg-muted hover:bg-muted"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading shipping data...
                  </TableCell>
                </TableRow>
              ) : filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No shipping data found. Please check if there are any cases with status 'completed' or 'shipped'.
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results match your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4 px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} of {shipments.length} shipments
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 15, 20, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <InvoicePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        caseDetails={
          selectedInvoiceForPreview ? [selectedInvoiceForPreview] : []
        }
      />
    </div>
  );
};

export default ShippingList;