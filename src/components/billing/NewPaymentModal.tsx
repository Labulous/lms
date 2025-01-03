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
import { Client, clientsService } from "@/services/clientsService";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
interface NewPaymentModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const PAYMENT_METHODS = [
  "Check",
  "Credit Card",
  "Bank Transfer",
  "Cash",
  "PayPal",
  "Other",
];

export function NewPaymentModal({ onClose, onSubmit }: NewPaymentModalProps) {
  const [date, setDate] = useState<Date>();
  const [selectedClient, setSelectedClient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [memo, setMemo] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentAllocation, setPaymentAllocation] = useState<
    Record<string, number>
  >({});
  const [overpaymentAmount, setOverpaymentAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  // Mock data - replace with API calls
  const balanceSummary = {
    thisMonth: 1900.0,
    lastMonth: 0.0,
    days30: 0.0,
    days60: 0.0,
    days90: 0.0,
    credit: 0.0,
    currentBalance: 1900.0,
  };

  const mockInvoices = [
    {
      id: "0023000003",
      date: "03/01/2023",
      patient: "Test G. Test",
      originalAmount: 1900.0,
      amountDue: 1900.0,
    },
  ];

  // Calculate payment distribution when amount changes
  const handlePaymentAmountChange = (newAmount: number) => {
    const totalDue = mockInvoices
      .filter((inv) => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + inv.amountDue, 0);

    setPaymentAmount(newAmount);

    // Handle overpayment
    if (newAmount > totalDue) {
      setOverpaymentAmount(newAmount - totalDue);
      setRemainingBalance(0);

      // Allocate full payment to each invoice
      const newAllocation = selectedInvoices.reduce((acc, invId) => {
        const invoice = mockInvoices.find((inv) => inv.id === invId);
        if (invoice) {
          acc[invId] = invoice.amountDue;
        }
        return acc;
      }, {} as Record<string, number>);
      setPaymentAllocation(newAllocation);
    }
    // Handle partial payment
    else if (newAmount < totalDue) {
      setOverpaymentAmount(0);
      setRemainingBalance(totalDue - newAmount);

      // Distribute payment proportionally
      const newAllocation = {} as Record<string, number>;
      let remainingPayment = newAmount;

      selectedInvoices.forEach((invId) => {
        const invoice = mockInvoices.find((inv) => inv.id === invId);
        if (invoice && remainingPayment > 0) {
          const proportion = invoice.amountDue / totalDue;
          const allocation = Math.min(
            invoice.amountDue,
            newAmount * proportion
          );
          newAllocation[invId] = Number(allocation.toFixed(2));
          remainingPayment -= allocation;
        } else {
          newAllocation[invId] = 0;
        }
      });
      setPaymentAllocation(newAllocation);
    }
    // Exact payment
    else {
      setOverpaymentAmount(0);
      setRemainingBalance(0);

      const newAllocation = selectedInvoices.reduce((acc, invId) => {
        const invoice = mockInvoices.find((inv) => inv.id === invId);
        if (invoice) {
          acc[invId] = invoice.amountDue;
        }
        return acc;
      }, {} as Record<string, number>);
      setPaymentAllocation(newAllocation);
    }
  };

  // Update payment allocation when invoices are selected
  const handleInvoiceSelect = (invoiceId: string, checked: boolean) => {
    const updatedInvoices = checked
      ? [...selectedInvoices, invoiceId]
      : selectedInvoices.filter((id) => id !== invoiceId);

    setSelectedInvoices(updatedInvoices);

    // Recalculate total amount based on selected invoices
    const totalAmount = mockInvoices
      .filter((invoice) => updatedInvoices.includes(invoice.id))
      .reduce((sum, invoice) => sum + invoice.amountDue, 0);

    handlePaymentAmountChange(totalAmount);
  };

  const handleSubmit = () => {
    const paymentData = {
      client: selectedClient,
      date,
      paymentMethod,
      memo,
      paymentAmount,
      selectedInvoices,
      paymentAllocation,
      overpaymentAmount,
      remainingBalance,
    };
    onSubmit(paymentData);
  };

  const isFormValid =
    selectedClient && date && paymentMethod && paymentAmount > 0;

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientsService.getClients();

        if (Array.isArray(data)) {
          setClients(data);
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
              status,
              patient_name,
              client:clients!client_id (
                id,
                client_name,
                phone
              ),
              case_number,
              invoicesData:invoices!case_id (
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
          .eq("lab_id", lab.labId)
          .eq("status", "completed")
          .eq("client_id", selectedClient)
          .order("created_at", { ascending: false });

        if (casesError) {
          console.error("Error fetching completed invoices:", casesError);
          return;
        }

        // Filter cases where invoicesData contains statuses not "draft", "paid", or "cancelled"
        const filteredCases = casesData?.filter((caseItem) =>
          caseItem.invoicesData.some(
            (invoice) =>
              invoice.status !== "draft" &&
              invoice.status !== "paid" &&
              invoice.status !== "cancelled"
          )
        );

        console.log("Filtered Cases:", filteredCases);
        setInvoices(filteredCases);
      } catch (error) {
        console.error("Error fetching completed invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedClient) {
      getCompletedInvoices();
    }
    console.log(selectedClient, "selected");
  }, [selectedClient]);

  console.log(selectedClient, "selected Client");
  console.log(invoices, "invoices");
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

          {/* Vertical Separator */}
          <Separator orientation="vertical" className="h-full" />

          {/* Right Column - Balance Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              Balance Summary
            </h3>

            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span>This Month</span>
                <span>${balanceSummary.thisMonth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Month</span>
                <span>${balanceSummary.lastMonth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>30+ Days</span>
                <span>${balanceSummary.days30.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>60+ Days</span>
                <span>${balanceSummary.days60.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>90+ Days</span>
                <span>${balanceSummary.days90.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Credit</span>
                <span>${balanceSummary.credit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Current Balance</span>
                <span>${balanceSummary.currentBalance.toFixed(2)}</span>
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
                  onChange={(e) =>
                    handlePaymentAmountChange(Number(e.target.value))
                  }
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
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {invoice.invoicesData[0].created_at}
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
                        ${invoice.invoicesData[0].amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.invoicesData[0].amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(paymentAllocation[invoice.id] || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={(checked) =>
                            handleInvoiceSelect(invoice.id, checked as boolean)
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

        {/* Footer Actions */}
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
