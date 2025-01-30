import { useEffect, useState } from "react";
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
import { Plus, Search, ArrowUpDown, PrinterIcon, MoreVertical, Eye } from "lucide-react";
import { InvoiceItem } from "@/data/mockInvoicesData";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { labDetail, PaymentListItem } from "@/types/supabase";
import { isValid, parseISO, format } from "date-fns";
import { Logger } from "html2canvas/dist/types/core/logger";
import { formatDate } from "@/lib/formatedDate";
import { updateBalanceTracking, updateBalanceTracking_new } from "@/lib/updateBalanceTracking";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import PaymentReceiptPreviewModal from "./print/PaymentReceiptPreviewModal";
import Payments from "@/pages/billing/Payments";

interface SortConfig {
  key: keyof PaymentListItem;
  direction: "asc" | "desc";
}

interface Invoice {
  case_number: string;
}

export function PaymentsList() {
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [paymentsList, setPaymentList] = useState<PaymentListItem[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentListItem[]>(
    []
  );



  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [labs, setLabs] = useState<labDetail[]>([]);


  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "payment_date",
    direction: "desc",
  });
  const [labData, setLabData] = useState<{
    labId: string;
    name: string;
  } | null>(null);

  const { user } = useAuth();

  const getPaymentList = async () => {
    debugger;
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
      setFilteredPayments(transformedPaymentList as PaymentListItem[]);
    } catch (err) {
      console.error("Error fetching payment list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = paymentsList.filter((payment) => {
      const searchableFields = [
        payment.clients?.client_name,
        payment.payment_method,
        payment.amount.toString(),
      ];

      return searchableFields.some((field) =>
        field?.toString().toLowerCase().includes(term)
      );
    });

    setFilteredPayments(filtered);
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

      const caseNumbers = updatedInvoices.map((inv: Invoice) => inv.case_number).join(",");
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
        credit: overpaymentAmount > 0 ? Math.max((existingBalanceTracking?.credit ?? 0) + overpaymentAmount, 0) : paymentMethod == "credit form" ? Math.max((existingBalanceTracking?.credit ?? 0) - paymentAmount, 0) : Math.max(existingBalanceTracking?.credit ?? 0),
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
    }
  };


  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("labs")
          .select(
            `
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
          `
          )
          .or(
            `super_admin_id.eq.${user?.id},admin_ids.cs.{${user?.id}},technician_ids.cs.{${user?.id}},client_ids.cs.{${user?.id}}`
          );

        if (error) {
          throw new Error(error.message);
        }

        // Assuming you want the first lab's details
        if (data && data.length > 0) {
          setLabs(data[0] as any);
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
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              className="pl-8"
              onChange={handleSearch}
            />
          </div>
          {selectedPayments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setIsPreviewModalOpen(true)}
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Receipts ({selectedPayments.length})
            </Button>
          )}
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
                    onCheckedChange={handleSelectAllPayments}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("payment_date")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Date{getSortIcon("payment_date")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("client_name")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Client{getSortIcon("client_name")}
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
                <TableHead
                  onClick={() => handleSort("payment_method")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Method{getSortIcon("payment_method")}
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
                    <TableCell className="text-right">
                      ${payment.over_payment.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${payment.remaining_payment.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <div className="" >
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
                              handleSelectPayment(payment.id, true as boolean)
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
