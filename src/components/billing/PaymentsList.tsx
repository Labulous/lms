import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NewPaymentModal } from "./NewPaymentModal";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  ArrowUpDown,
  PrinterIcon,
  MoreVertical,
  Eye,
  Filter,
  CalendarIcon,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { InvoiceItem } from "@/data/mockInvoicesData";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { labDetail, PaymentListItem } from "@/types/supabase";
import { isValid, parseISO, format } from "date-fns";
import { Logger } from "html2canvas/dist/types/core/logger";
import { formatDate } from "@/lib/formatedDate";
import {
  updateBalanceTracking,
  updateBalanceTracking_new,
} from "@/lib/updateBalanceTracking";
import { cn } from "@/lib/utils";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaymentReceiptPreviewModal from "./print/PaymentReceiptPreviewModal";
import Payments from "@/pages/billing/Payments";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange, DayPicker } from "react-day-picker";
interface SortConfig {
  key: keyof PaymentListItem;
  direction: "asc" | "desc";
}

interface Invoice {
  case_number: string;
}
interface Client {
  client_name: ReactNode;
  id: string;
  account_number: string;
  clientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
}
export function PaymentsList() {
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [paymentsList, setPaymentList] = useState<PaymentListItem[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentListItem[]>(
    []
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  //const [dateRange, setDateRange] = useState<  undefined>();
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [labs, setLabs] = useState<labDetail[]>([]);
  // const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "payment_date",
    direction: "desc",
  });
  const [labData, setLabData] = useState<{
    labId: string;
    name: string;
  } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const { user } = useAuth();
  const getClientsList = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, client_name,account_number"); // Select only necessary client fields

      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
        return;
      }

      setClients(clientsData as Client[]);
    } catch (error) {
      console.error("Error fetching clients list:", error);
    }
  };

  const getPaymentList = async () => {
    setLoading(true);

    try {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }
      setLabData(lab);
      const { data: paymentList, error: paymentListError } = await supabase
        .from("payments")
        .select(
          `
            id,
            payment_date,
            amount,
            payment_method,
            status,
            over_payment,
            remaining_payment,
             client_id,
            clients!client_id ( client_name )
          `
        )
        .eq("lab_id", lab.labId)
        .order("payment_date", { ascending: false });

      if (paymentListError) {
        console.error("Error fetching payments:", paymentListError);
        return;
      }

      const transformedPaymentList = paymentList?.map((payment: any) => ({
        ...payment,
        client_name: payment.clients?.client_name,
      }));

      setPaymentList(transformedPaymentList as PaymentListItem[]);
      // setClients(transformedPaymentList);
      getClientsList();
      setFilteredPayments(transformedPaymentList as PaymentListItem[]);
    } catch (err) {
      console.error("Error fetching payment list:", err);
    } finally {
      setLoading(false);
    }
  };
  // const processClientData = (data: any[]) => {
  //   try {
  //     // Transform to match the standardized client interface
  //     const transformedClients: Client[] = data.map(client => ({
  //       id: client.id,
  //       clientName: client.client_name || '',
  //       accountNumber: client.account_number || '',
  //       phone: client.phone || '',
  //       street: client.street || '',
  //       city: client.city || '',
  //       state: client.state || '',
  //       zipCode: client.zip_code || ''
  //     }));

  //     setClients(transformedClients);
  //   } catch (error) {
  //     console.error('Error processing client data:', error);
  //   }
  // };
  // const applyFilters = (term: string, client: Client | null) => {
  //   let filtered = [...clients];

  //   // Apply search term filter
  //   if (term) {
  //     filtered = filtered.filter(shipment =>
  //       client?.accountNumber.toLowerCase().includes(term.toLowerCase()) ||
  //       client?.client_name.toLowerCase().includes(term.toLowerCase())
  //       // client..toLowerCase().includes(term.toLowerCase()) ||
  //       // (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(term.toLowerCase()))
  //     );
  //   }

  //   // Apply client filter
  //   if (client) {
  //     filtered = filtered.filter(shipment =>
  //       shipment.clientId === client.id
  //     );
  //   }

  //   // setFilteredShipments(filtered);
  // };
  // const applyFilters = (generalSearch: string, client: Client | null) => {
  //   let filtered = paymentsList;

  //   if (generalSearch) {
  //     filtered = filtered.filter(payment =>
  //       Object.values(payment).some(value =>
  //         String(value).toLowerCase().includes(generalSearch.toLowerCase())
  //       )
  //     );
  //   }

  //   if (client) {
  //     filtered = filtered.filter(payment => payment.client_id === client.id);
  //   }

  //   setFilteredPayments(filtered);
  // };
  useEffect(() => {
    const updateFilteredPayments = () => {
      let filtered = [...paymentsList];

      if (searchTerm) {
        filtered = filtered.filter((payment) => {
          const searchableFields = [
            payment.clients?.client_name,
            payment.payment_method,
            payment.amount.toString(),
          ];
          return searchableFields.some((field) =>
            field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }

      if (selectedClient) {
        filtered = filtered.filter(payment => payment.client_id === selectedClient.id);
      }

      if (dateRange?.from || dateRange?.to) {
        filtered = filtered.filter((payment) => {
          const paymentDate = new Date(payment.payment_date);
          const from = dateRange.from ? new Date(dateRange.from) : null;
          const to = dateRange.to ? new Date(dateRange.to) : null;

          // Normalize dates to cover entire days
          if (from) from.setHours(0, 0, 0, 0);
          if (to) to.setHours(23, 59, 59, 999);

          return (
            (!from || paymentDate >= from) &&
            (!to || paymentDate <= to)
          );
        });
      }
      // if (selectedMethod) {
      //   filtered = filtered.filter(payment =>
      //     payment.payment_method === selectedMethod
      //   );
      // }
      if (selectedMethod) {
        filtered = filtered.filter(payment =>
          payment.payment_method === selectedMethod
        );
      }

      setFilteredPayments(filtered);
    };

    updateFilteredPayments();
  }, [searchTerm, selectedClient, dateRange, paymentsList, selectedMethod]);
  // const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const term = e.target.value.toLowerCase();
  //   setSearchTerm(term);

  //   const filtered = paymentsList.filter((payment) => {
  //     const searchableFields = [
  //       payment.clients?.client_name,
  //       payment.payment_method,
  //       payment.amount.toString(),
  //     ];

  //     return searchableFields.some((field) =>
  //       field?.toString().toLowerCase().includes(term)
  //     );
  //   });

  //   setFilteredPayments(filtered);
  // };
  const handleClientSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  const handleClientSearchKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };
  const handleMethodSelect = (method: string | null) => {
    setSelectedMethod(method);
  };
  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSearchTerm(e.target.value);
  };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
  // const handleClientSelect = (client: Client) => {
  //   setSelectedClient(client);
  //   applyFilters(searchTerm, client);
  // };
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };
  const handleSort = (key: keyof PaymentListItem) => {
    setSortConfig((currentConfig) => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const getSortIcon = (key: keyof PaymentListItem) => {
    if (sortConfig.key === key) {
      return (
        <ArrowUpDown
          className={cn(
            "ml-2 h-4 w-4",
            sortConfig.direction === "asc" ? "transform rotate-180" : ""
          )}
        />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
  };
  // const filteredClients = useMemo(() => {
  //   if (!clientSearchTerm.trim()) return clients;

  //   return clients.filter(client =>
  //     client.client_name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  //     // client.accountNumber.toLowerCase().includes(clientSearchTerm.toLowerCase())
  //   );
  // }, [clients, clientSearchTerm]);
  // const filteredClients = useMemo(() => {
  //   if (!clientSearchTerm.trim()) return clients;

  //   return clients.filter(client =>
  //     client.client_name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  //   );
  // }, [clients, clientSearchTerm]);
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return clients;

    return clients.filter(client =>
      typeof client.client_name === "string" &&
      client.client_name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);


  console.log(clients, "filtered clients =====================================================>>>>>>>>>>>>>>>>>>>>>>>>>")
  useEffect(() => {
    console.log("Filtered Clients:", filteredClients);
  }, [filteredClients]); // Log whenever filteredClients changes

  const getSortedData = () => {
    const sorted = [...filteredPayments].sort((a, b) => {
      if (sortConfig.key === "payment_date") {
        const dateA = new Date(a.payment_date).getTime();
        const dateB = new Date(b.payment_date).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortConfig.key === "amount") {
        return sortConfig.direction === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // useEffect(() => {
  //   if (filteredPayments.length > 0) {
  //     setSelectedPayments(filteredPayments.map((payment) => payment.id));
  //   }
  // }, [filteredPayments]);

  // const handleSelectAllPayments = (checked: boolean) => {
  //   if (checked) {
  //     setSelectedPayments(filteredPayments.map((payment) => payment.id));
  //   } else {
  //     setSelectedPayments([]);
  //   }
  // };
  const handleSelectAllPayments = (checked: boolean) => {
    if (checked) {
      const allPaymentIds = filteredPayments.map((payment) => payment.id);
      setSelectedPayments(allPaymentIds);
    } else {
      setSelectedPayments([]);
    }
  };

  const handleSelectPayments = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments([...selectedPayments, paymentId]);
    } else {
      setSelectedPayments(selectedPayments.filter((id) => id !== paymentId));
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments([paymentId]);
    } else {
      setSelectedPayments([]);
    }
  };

  const handlePrintReceipts = async () => {
    // TODO: Implement print receipts functionality
    toast.success("Print receipts functionality coming soon!");
  };

  useEffect(() => {
    getPaymentList();
  }, []);

  const handleNewPayment = async (paymentData: any) => {
    debugger;
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

      const caseNumbers = updatedInvoices
        .map((inv: Invoice) => inv.case_number)
        .join(",");
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
          .eq("lab_id", labData?.labId);

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
        lab_id: labData?.labId,
      };

      const { data: insertedPayment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentDataToInsert)
        .select("*");

      if (paymentError) {
        throw new Error(`Failed to insert payment: ${paymentError.message}`);
      }

      // Insert a new credit adjustment
      if (paymentMethod == "credit form") {
        const { error: insertError } = await supabase
          .from("adjustments")
          .insert({
            client_id: client,
            credit_amount: paymentAmount,
            description: `Adjustment for the invoice ${caseNumbers}`,
            lab_id: labData?.labId,
            payment_date: date,
          });
      }
      if (paymentMethod !== "credit form" && overpaymentAmount > 0) {
        const { error: adjustmentError } = await supabase
        .from("adjustments")
        .insert({
          client_id: client,
          credit_amount: overpaymentAmount,
          description: `Overpayment: ${caseNumbers}`,
          lab_id: labData?.labId,
          payment_date: date,
        });

      if (adjustmentError) {
        throw new Error(`Failed to insert payment: ${adjustmentError.message}`);
      }
      }

      console.log("Payment inserted successfully.", insertedPayment);
      //await updateBalanceTracking();

      // Step 3: Fetch and categorize invoices for balance tracking
      const { data: categorizedInvoices, error: fetchError } = await supabase
        .from("invoices")
        .select("due_amount, due_date")
        .eq("client_id", client)
        .in("status", ["unpaid", "partially_paid"])
        .gt("due_amount", 0);

      if (fetchError) {
        throw new Error(
          `Failed to fetch categorized invoices: ${fetchError.message}`
        );
      }

      const balances = {
        this_month: 0,
        last_month: 0,
        days_30_plus: 0,
        days_60_plus: 0,
        days_90_plus: 0,
      };

      const currentDate = new Date();

      categorizedInvoices.forEach((invoice) => {
        const dueDate = new Date(invoice.due_date);
        const differenceInDays = Math.floor(
          (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (differenceInDays <= 30) {
          balances.this_month += invoice.due_amount;
        } else if (differenceInDays <= 60) {
          balances.last_month += invoice.due_amount;
        } else if (differenceInDays <= 90) {
          balances.days_30_plus += invoice.due_amount;
        } else if (differenceInDays <= 120) {
          balances.days_60_plus += invoice.due_amount;
        } else {
          balances.days_90_plus += invoice.due_amount;
        }
      });

      // Calculate outstanding_balance as the sum of all balance fields
      const outstandingBalance =
        balances.this_month +
        balances.last_month +
        balances.days_30_plus +
        balances.days_60_plus +
        balances.days_90_plus;

      // Step 4: Check if balance_tracking row exists and update or create it
      const { data: existingBalanceTracking, error: checkError } =
        await supabase
          .from("balance_tracking")
          .select("id,credit")
          .eq("client_id", client)
          .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 indicates no rows found
        throw new Error(
          `Failed to check balance_tracking: ${checkError.message}`
        );
      }

      const balanceUpdate = {
        ...balances,
        outstanding_balance: outstandingBalance,
        credit:
          overpaymentAmount > 0
            ? Math.max(
              (existingBalanceTracking?.credit ?? 0) + overpaymentAmount,
              0
            )
            : paymentMethod == "credit form"
              ? Math.max(
                (existingBalanceTracking?.credit ?? 0) - paymentAmount,
                0
              )
              : Math.max(existingBalanceTracking?.credit ?? 0),
        updated_at: new Date().toISOString(),
        client_id: client,
      };

      if (existingBalanceTracking) {
        // Update existing row
        const { error: updateBalanceError } = await supabase
          .from("balance_tracking")
          .update(balanceUpdate)
          .eq("id", existingBalanceTracking.id);

        if (updateBalanceError) {
          throw new Error(
            `Failed to update balance_tracking: ${updateBalanceError.message}`
          );
        }

        console.log("Balance tracking updated successfully.");
      } else {
        // Insert new row
        const { error: insertBalanceError } = await supabase
          .from("balance_tracking")
          .insert(balanceUpdate);

        if (insertBalanceError) {
          throw new Error(
            `Failed to insert balance_tracking: ${insertBalanceError.message}`
          );
        }

        console.log("Balance tracking created successfully.");
      }
    } catch (err) {
      console.error("Error handling new payment:", err);
      toast.error("Failed to add payment or update balance tracking.");
    } finally {
      toast.success("New payment added successfully.");
      setShowNewPaymentModal(false);
      getPaymentList()
    }
  };

  const clearClientFilter = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    // applyFilters(searchTerm, null);
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
          const formData = data[0].lab;
          setLabs(formData as any);
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
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    paymentsList.forEach(payment => {
      if (payment.payment_method) methods.add(payment.payment_method);
    });
    return Array.from(methods);
  }, [paymentsList]);
  type PaymentMethod = typeof paymentMethods[number];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Manage and track all your payment records
          </p>
        </div>
        <Button
          onClick={() => setShowNewPaymentModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Payment
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 mr-14">
          <span className="text-sm text-muted-foreground mr-2">
            {selectedPayments.length || 0}{" "}
            {selectedPayments.length === 1 ? "payment" : "payments"} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewModalOpen(true)}
            disabled={selectedPayments.length === 0}
            className={selectedPayments.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print Receipts ({selectedPayments.length})
          </Button>
          {/* {selectedPayments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setIsPreviewModalOpen(true)}
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Receipts ({selectedPayments.length})
            </Button>
          )} */}
        </div>
        {/* <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-20">
            {selectedPayments.length || 0}{" "}
            {selectedPayments.length === 1 ? "payment" : "payments"} selected
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewModalOpen(true)}
            disabled={selectedPayments.length === 0}
            className={selectedPayments.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print Receipts ({selectedPayments.length})
          </Button>
        </div> */}

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                  ) : (
                    format(dateRange.from, 'MMM dd, yyyy')
                  )
                ) : (
                  'Select Custom Date'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex items-center justify-between pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setDateRange(undefined)}
                >
                  Clear Filter
                </Button>
              </div>
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                className="border-none"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-right justify-end space-x-2 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                {selectedClient ? `Client: ${selectedClient.client_name}` : 'Filter by Client'}
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
                      <div className="font-medium">{client.client_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Account: {client.account_number}
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
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            className="pl-8"
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredPayments.length > 0 &&
                      selectedPayments.length === filteredPayments.length
                    }
                    //onCheckedChange={handleSelectAllPayments}
                    onCheckedChange={(checked) => handleSelectAllPayments(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                {/* <TableHead
                  onClick={() => handleSort("payment_date")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Date{getSortIcon("payment_date")}
                  </div>
                </TableHead> */}
                <TableHead className="cursor-pointer whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">
                          {dateRange?.from ? (
                            dateRange.to ? (
                              `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                            ) : (
                              format(dateRange.from, "MMM dd, yyyy")
                            )
                          ) : (
                            "Date"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex items-center justify-between pb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => setDateRange(undefined)}
                          >
                            Clear Filter
                          </Button>
                        </div>
                        <DayPicker
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          className="border-none"
                        />
                      </PopoverContent>
                    </Popover>
                    <ArrowUpDown
                      className="h-4 w-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort("payment_date");
                      }}
                    />
                  </div>
                </TableHead>

                {/* <TableHead
                  onClick={() => handleSort("client_name")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Client{getSortIcon("client_name")}
                  </div>
                </TableHead> */}
                <TableHead className="cursor-pointer whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">
                          {selectedClient ? `Client: ${selectedClient.client_name}` : "Client"}
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
                            filteredClients.map((client) => (
                              <DropdownMenuItem
                                key={client.id}
                                onClick={() => handleClientSelect(client)}
                                className="flex flex-col items-start py-2"
                              >
                                <div className="font-medium">{client.client_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Account: {client.account_number}
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
                    <ArrowUpDown
                      className="h-4 w-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort("client_name");
                      }}
                    />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("amount")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Amount{getSortIcon("amount")}
                  </div>
                </TableHead>
                {/* <TableHead
                  onClick={() => handleSort("payment_method")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Method{getSortIcon("payment_method")}
                  </div>
                </TableHead> */}
                <TableHead className="cursor-pointer whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">Method</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setSelectedMethod(null)}>
                          All Methods
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {paymentMethods.map((method) => (
                          <DropdownMenuItem key={method} onClick={() => setSelectedMethod(method)}>
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ArrowUpDown
                      className="h-4 w-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort("payment_method");
                      }}
                    />

                  </div>
                </TableHead>

                <TableHead className="text-right">Over Payment</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell>
                      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
                : getSortedData().map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onCheckedChange={(checked) =>
                          handleSelectPayments(payment.id, checked as boolean)
                        }
                        aria-label={`Select payment ${payment.id}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(payment.payment_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {payment.clients?.client_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {payment.payment_method}
                    </TableCell>
                    {/* <TableCell className="text-right">
                      ${payment.over_payment.toFixed(2)}
                    </TableCell> */}
                    <TableCell
                      className={"bg-red-500 text-white my-0 h-12 flex justify-center items-center text-center"}
                    >
                      ${payment.over_payment.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-right">
                      ${payment.remaining_payment.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                          >
                            <div className="">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="flex space-x-4 bg-gray-50 p-2 rounded-md"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              handleSelectPayment(
                                payment.id,
                                true as boolean
                              );
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
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {showNewPaymentModal && (
        <NewPaymentModal
          onClose={() => setShowNewPaymentModal(false)}
          onSubmit={handleNewPayment}
        />
      )}

      {isPreviewModalOpen && (
        <PaymentReceiptPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
          }}
          caseDetails={filteredPayments.filter((payment: any) =>
            selectedPayments.includes(payment.id)
          )}
          labData={labs}
        />
      )}
    </div>
  );
}
