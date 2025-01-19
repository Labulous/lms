import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Client as ClientItem,
  clientsService,
} from "@/services/clientsService";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { BalanceTrackingItem } from "@/types/supabase";
import { formatDate } from "@/lib/formatedDate";
interface NewPaymentModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSingleInvoice?: boolean;
  clientId?: string;
  invoiceId?: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  case_id: string;
  due_date: string;
  created_at: string;
  due_amount: number;
}

interface ProductId {
  id: string;
  products_id: string[];
}

interface Client {
  id: string;
  client_name: string;
}

interface Case {
  id: string;
  created_at: string;
  received_date: string;
  status: string;
  patient_name: string;
  case_number: string;
  client: Client;
  invoicesData: Invoice[];
  product_ids: ProductId[];
}

const PAYMENT_METHODS = [
  "Check",
  "Credit Card",
  "Bank Transfer",
  "Cash",
  "PayPal",
  "Other",
];

export function NewPaymentModal({
  onClose,
  onSubmit,
  isSingleInvoice,
  clientId,
  invoiceId,
}: NewPaymentModalProps) {
  const [date, setDate] = useState<Date>();
  const [selectedClient, setSelectedClient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [memo, setMemo] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentAllocation, setPaymentAllocation] = useState<
    Record<string, number>
  >({});
  const [overpaymentAmount, setOverpaymentAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [invoices, setInvoices] = useState<Case[]>([]);
  const [updatedInvoices, setUpdatedInvoices] = useState<Case[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [balanceSummary, setBalanceSummary] =
    useState<BalanceTrackingItem | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only valid numbers
    if (!isNaN(Number(value)) && Number(value) >= 0) {
      setPaymentAmount(Number(value));
    }
  };

  const handleInvoiceSelect = (
    invoiceId: string,
    checked: boolean,
    allocatedAmount?: number | null
  ) => {
    const invoice = invoices.find((invoice) => invoice.id === invoiceId);
    if (!invoice) return;

    const due_amount = invoice?.invoicesData?.[0]?.due_amount ?? 0;

    if (checked) {
      setPaymentAllocation((prevAllocation) => {
        const totalAllocated = Object.values(prevAllocation).reduce(
          (sum, value) => sum + value,
          0
        );
        const remainingPayment = paymentAmount - totalAllocated;

        // Allocate payment for this invoice
        const allocated = Math.min(due_amount, remainingPayment);
        const updatedAllocation = {
          ...prevAllocation,
          [invoiceId]: (prevAllocation[invoiceId] || 0) + allocated,
        };

        // Update remaining balance and credit based on updated allocation
        const newTotalAllocated = Object.values(updatedAllocation).reduce(
          (sum, value) => sum + value,
          0
        );

        setRemainingBalance(
          (balanceSummary?.outstanding_balance || 0) - newTotalAllocated
        );
        setOverpaymentAmount(Math.max(0, paymentAmount - newTotalAllocated));

        return updatedAllocation;
      });

      setUpdatedInvoices((prevInvoices) => {
        const updatedInvoices = [...prevInvoices];
        const existingInvoiceIndex = updatedInvoices.findIndex(
          (inv) => inv.id === invoiceId
        );

        if (existingInvoiceIndex !== -1) {
          updatedInvoices[existingInvoiceIndex] = {
            ...updatedInvoices[existingInvoiceIndex],
            invoicesData: updatedInvoices[existingInvoiceIndex]
              ?.invoicesData?.[0]
              ? [
                  {
                    ...updatedInvoices[existingInvoiceIndex].invoicesData[0],
                    due_amount: Math.max(
                      0,
                      updatedInvoices[existingInvoiceIndex].invoicesData[0]
                        .due_amount - allocatedAmount!
                    ),
                  },
                ]
              : [],
          };
        } else {
          updatedInvoices.push({
            ...invoice,
            invoicesData: invoice?.invoicesData
              ? [
                  {
                    ...invoice.invoicesData[0],
                    due_amount: Math.max(0, due_amount - allocatedAmount!),
                  },
                ]
              : [],
          });
        }

        return updatedInvoices;
      });
    } else {
      // Handle deselection
      setPaymentAllocation((prevAllocation) => {
        const { [invoiceId]: removed, ...rest } = prevAllocation;

        // Recalculate the total allocation after deselecting the invoice
        const newTotalAllocated = Object.values(rest).reduce(
          (sum, value) => sum + value,
          0
        );

        setRemainingBalance(
          (balanceSummary?.outstanding_balance || 0) - newTotalAllocated
        );
        setOverpaymentAmount(Math.max(0, paymentAmount - newTotalAllocated));

        return rest;
      });

      setUpdatedInvoices((prevInvoices) =>
        prevInvoices.filter((inv) => inv.id !== invoiceId)
      );
    }
  };

  const handleSubmit = () => {
    const paymentData = {
      client: selectedClient,
      date,
      paymentMethod,
      memo,
      paymentAmount,
      paymentAllocation,
      overpaymentAmount,
      remainingBalance,
      updatedInvoices,
    };
    onSubmit(paymentData);
  };

  const isFormValid =
    selectedClient && date && paymentMethod && paymentAmount > 0;

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setSelectedClient(clientId ? clientId : "");
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return null;
        }
        setLab(labData);
        const data = await clientsService.getClients(labData.labId);

        if (Array.isArray(data)) {
          setPaymentAmount(0);
          setClients(data);
          setUpdatedInvoices([]);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);
  useEffect(() => {
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
              status,
              patient_name,
              client:clients!client_id (
                id,
                client_name
              ),
              case_number,
              invoicesData:invoices!case_id (
              id,
                case_id,
                amount,
                status,
                due_date,
                due_amount,
                created_at
              ),
              product_ids:case_products!id (
                products_id,
                id
              )
            `
          )
          .eq("lab_id", lab?.labId)
          .eq("status", "completed")
          .eq("client_id", selectedClient)
          .order("created_at", { ascending: true });

        if (casesError) {
          console.error("Error fetching completed invoices:", casesError);
          return;
        }
        // Filter cases where invoicesData contains statuses not "draft", "paid", or "cancelled"
        const filteredCases: any = casesData?.filter((caseItem) =>
          caseItem.invoicesData.some((invoice) => {
            // Check if invoiceId is provided
            if (invoiceId) {
              // Only include items where invoice.id matches invoiceId
              return (
                invoice.id === invoiceId &&
                invoice.status !== "Draft" &&
                invoice.status !== "paid" &&
                invoice.status !== "Cancelled"
              );
            }
            // Otherwise, apply the existing conditions
            return (
              invoice.status !== "Draft" &&
              invoice.status !== "paid" &&
              invoice.status !== "Cancelled"
            );
          })
        );

        setInvoices(filteredCases || []);

        // Fetch balance_tracking data for the selected client
        const { data: balanceData, error: balanceError } = await supabase
          .from("balance_tracking")
          .select("*")
          .eq("client_id", selectedClient)
          .single();

        if (balanceError) {
          console.error("Error fetching balance tracking data:", balanceError);
          return;
        }

        setBalanceSummary(balanceData);
      } catch (error) {
        console.error("Error fetching completed invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedClient && lab?.labId) {
      getCompletedInvoices();
    }
  }, [selectedClient, lab]);
  console.log(invoices, "set Invoices");
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-[800px] w-[90vw] max-w-[1200px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl">New Payment</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr,auto,1fr] gap-6 mt-6">
          {/* Left Column - Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              Payment Information
            </h3>

            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment for
                </label>
                <Select
                  value={selectedClient}
                  disabled={isSingleInvoice}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientName}
                      </SelectItem>
                    ))}{" "}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <DatePicker
                  date={date}
                  onSelect={setDate}
                  className="w-full"
                  placeholder="Select payment date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method.toLowerCase()}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Memo</label>
                <Input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Add memo"
                />
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-full" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              Balance Summary
            </h3>

            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span>This Month</span>
                <span>${(balanceSummary?.this_month ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Month</span>
                <span>${(balanceSummary?.last_month ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>30+ Days</span>
                <span>${(balanceSummary?.days_30_plus ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>60+ Days</span>
                <span>${(balanceSummary?.days_60_plus ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>90+ Days</span>
                <span>${(balanceSummary?.days_90_plus ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Credit</span>
                <span>${(balanceSummary?.credit ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Current Balance</span>
                <span>
                  ${(balanceSummary?.outstanding_balance ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4 mt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">
                  Payment Calculator
                </span>
                <span className="text-xl font-medium">
                  ${paymentAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Amount
                </label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={handleInputChange}
                  className="text-right"
                />
              </div>
              {overpaymentAmount > 0 && (
                <div className="text-sm text-yellow-600">
                  Overpayment: ${overpaymentAmount.toFixed(2)} will be credited
                  to the account
                </div>
              )}
              {remainingBalance > 0 && (
                <div className="text-sm text-orange-600">
                  Remaining Balance: ${remainingBalance.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Separator */}
        <Separator className="my-6" />

        {/* Invoices and Statements Tabs */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-4">
            Invoice Details
          </h3>
          <Tabs defaultValue="invoices" className="bg-muted/50 p-4 rounded-lg">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="statements">Statements</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">
                      Original Amount
                    </TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices &&
                    invoices.length > 0 &&
                    invoices?.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {formatDate(invoice.invoicesData[0]?.created_at)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const caseNumber = invoice?.case_number ?? ""; // Default to an empty string if undefined
                            const parts = caseNumber.split("-");
                            parts[0] = "INV"; // Replace the first part
                            return parts.join("-");
                          })()}
                        </TableCell>
                        <TableCell>{invoice.patient_name}</TableCell>
                        <TableCell className="text-right">
                          ${invoice?.invoicesData[0]?.amount ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          ${invoice.invoicesData[0].due_amount ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {paymentAllocation[invoice.id] >= 0
                            ? paymentAllocation[invoice.id]
                            : 0}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={paymentAllocation[invoice.id] > 0}
                            disabled={
                              (paymentAmount === 0 ||
                                Object.values(paymentAllocation).reduce(
                                  (sum, value) => sum + value,
                                  0
                                ) >= paymentAmount) &&
                              !(paymentAllocation[invoice.id] > 0)
                            }
                            onCheckedChange={(checked) =>
                              handleInvoiceSelect(
                                invoice.id,
                                checked as boolean,
                                paymentAllocation[invoice.id]
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="statements">
              <div className="text-center py-4 text-muted-foreground">
                No statements available
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="bg-primary hover:bg-primary/90"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
