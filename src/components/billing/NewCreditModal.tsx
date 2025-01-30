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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Client as ClientItem,
  clientsService,
} from "@/services/clientsService";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BalanceTrackingItem } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { formatDate } from "@/lib/formatedDate";

interface NewCreditModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

type CreditType = "apply" | "retain";

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

export function NewCreditModal({ onClose, onSubmit }: NewCreditModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [selectedClient, setSelectedClient] = useState("");
  const [description, setDescription] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<CreditType>("apply");
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [invoices, setInvoices] = useState<Case[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updatedInvoices, setUpdatedInvoices] = useState<Case[]>([]);
  const [overpaymentAmount, setOverpaymentAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [balanceSummary, setBalanceSummary] =
    useState<BalanceTrackingItem | null>(null);
  const [paymentAllocation, setPaymentAllocation] = useState<
    Record<string, number>
  >({});
  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return null;
        }
        setLab(labData);
        const data = await clientsService.getClients(labData?.labId);

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

  // Fetch invoices when client is selected and type is "apply"
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedClient || creditType !== "apply") {
        setInvoices([]);
        return;
      }

      try {
        setLoading(true);

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

        const filteredCases: any = casesData?.filter((caseItem) =>
          caseItem.invoicesData.some(
            (invoice) =>
              invoice.status !== "Draft" &&
              invoice.status !== "paid" &&
              invoice.status !== "Cancelled"
          )
        );

        setInvoices(filteredCases);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast.error("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [selectedClient, creditType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = "Date is required";
    if (!selectedClient) newErrors.client = "Client is required";
    if (!description) newErrors.description = "Description is required";
    if (!paymentAmount || paymentAmount <= 0)
      newErrors.amount = "Valid amount is required";
    if (creditType === "apply" && selectedInvoices.length === 0) {
      newErrors.invoices = "Select at least one invoice";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  console.log(selectedClient, "selectedClient");
  const handleSubmit = async () => {
    debugger;
    try {
      setLoading(true);

      const creditData = {
        date,
        client_id: selectedClient,
        description,
        paymentAmount,
        type: creditType,
        applied_invoices: creditType === "apply" ? selectedInvoices : [],
      };
      const paymentData = {
        client: selectedClient,
        date,
        paymentMethod: "credit form",
        memo: description,
        paymentAmount,
        paymentAllocation,
        overpaymentAmount,
        remainingBalance,
        updatedInvoices,
        labId: lab?.labId,
        type: "apply",
      };
      if (creditType === "apply") {
        await onSubmit(paymentData);
      } else {
        await onSubmit(creditData);
      }

      toast.success("Credit created successfully");
      // onClose();
    } catch (error) {
      console.error("Error creating credit:", error);
      toast.error("Failed to create credit");
    } finally {
      setLoading(false);
    }
  };
  console.log(clients, "clients");
  console.log(creditType, "creditType");

  const handlePaymentAmountChange = (newAmount: number) => {
    debugger;
    let remainingAmount = newAmount; // Payment amount to be allocated
    let tempNewAmount = newAmount;

    const freshInvoices = JSON.parse(JSON.stringify(invoices));

    const newUpdatedInvoices: any = freshInvoices.map((inv: any) => {
      // Ensure invoicesData is an array or default to an empty array
      const invoicesData = Array.isArray(inv?.invoicesData)
        ? inv.invoicesData
        : [];

      const updatedInvoice = { ...inv, invoicesData: [...invoicesData] };

      if (tempNewAmount > 0) {
        const dueAmount = updatedInvoice?.invoicesData[0]?.due_amount || 0; // Handle undefined safely

        if (tempNewAmount >= dueAmount) {
          tempNewAmount -= dueAmount;
          updatedInvoice.invoicesData[0].due_amount = 0;
        } else {
          updatedInvoice.invoicesData[0].due_amount -= tempNewAmount;
          tempNewAmount = 0;
        }
      }

      return updatedInvoice;
    });

    // Set the updated invoices
    setUpdatedInvoices(newUpdatedInvoices);

    // Allocate payments based on the remaining amount
    const newAllocation = invoices.reduce(
      (acc: Record<string, number>, inv: any) => {
        if (remainingAmount > 0 && inv.invoicesData?.[0]) {
          const dueAmount = inv.invoicesData[0].due_amount;

          if (remainingAmount >= dueAmount) {
            // Fully allocate to this invoice
            acc[inv.id] = dueAmount;
            remainingAmount -= dueAmount;
          } else {
            // Partially allocate to this invoice
            acc[inv.id] = remainingAmount;
            remainingAmount = 0;
          }
        } else {
          // No allocation if there's no remaining amount
          acc[inv.id] = 0;
        }
        return acc;
      },
      {}
    );

    // Calculate total due
    const totalDue = invoices.reduce(
      (sum: number, inv: any) =>
        sum + (inv?.invoicesData?.[0]?.due_amount || 0),
      0
    );

    // Calculate overpayment and remaining balance
    const overpayment = Math.max(0, remainingAmount); // Remaining amount after covering all invoices
    const remainingBalance = Math.max(0, totalDue - newAmount); // Unpaid balance if the entered amount is less than total due

    // Update state
    setPaymentAllocation(newAllocation);
    setOverpaymentAmount(overpayment);
    setRemainingBalance(remainingBalance); // Update remaining balance
    setPaymentAmount(newAmount); // Update the processed payment amount
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debugger;
    const value = e.target.value;
    setPaymentAmount(Number(value));
    if (!isNaN(Number(value)) && Number(value) >= 0) {
      handlePaymentAmountChange(Number(value)); // Process new value
    }
    // Allow only valid numbers
  };

  const handleInvoiceSelect = (
    invoiceId: string,
    checked: boolean,
    reducePayment?: number | null
  ) => {
    debugger;
    console.log("select");
    const invoice = invoices.find((invoice) => invoice.id === invoiceId);
    if (invoice) {
      const due_amount = invoice?.invoicesData?.[0]?.due_amount ?? 0;

      if (checked) {
        let remainingAmount;
        setPaymentAllocation((prevAllocation) => {
          const totalAllocated = Object.values(prevAllocation).reduce(
            (sum, value) => sum + value,
            0
          );
          let remainingPayment = paymentAmount - totalAllocated;
          remainingAmount = remainingPayment;
          if (remainingPayment > 0) {
            const allocatedAmount = Math.min(due_amount, remainingPayment);

            const updatedAllocation = {
              ...prevAllocation,
              [invoiceId]: (prevAllocation[invoiceId] || 0) + allocatedAmount,
            };

            return updatedAllocation;
          }

          return prevAllocation;
        });

        setUpdatedInvoices((prevInvoices) => {
          const totalAllocated = Object.values(paymentAllocation).reduce(
            (sum, value) => sum + value,
            0
          );
          const remainingPayment = paymentAmount - totalAllocated;
          const updatedInvoices = [...prevInvoices];
          const existingInvoiceIndex = updatedInvoices.findIndex(
            (inv) => inv.id === invoiceId
          );

          if (remainingPayment > 0) {
            const allocatedAmount = Math.min(due_amount, remainingPayment);

            if (existingInvoiceIndex !== -1) {
              updatedInvoices[existingInvoiceIndex] = {
                ...updatedInvoices[existingInvoiceIndex],
                invoicesData: updatedInvoices[existingInvoiceIndex]
                  ?.invoicesData?.[0]
                  ? [
                    {
                      ...updatedInvoices[existingInvoiceIndex]
                        .invoicesData[0],
                      due_amount:
                        updatedInvoices[existingInvoiceIndex].invoicesData[0]
                          .due_amount - allocatedAmount,
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
                      due_amount:
                        invoice.invoicesData[0].due_amount - allocatedAmount,
                    },
                  ]
                  : [],
              });
            }
          }

          return updatedInvoices;
        });

        // Now that allocation and invoices are updated, we can calculate the remaining balance
        // Calculate the total allocated amount after updates
        const totalAllocated = Object.values(paymentAllocation).reduce(
          (sum, value) => sum + value,
          0
        );
        const remainingPayment = paymentAmount - totalAllocated;

        // Update the remaining balance with the updated allocation
        const newRemainingBalance =
          (balanceSummary?.outstanding_balance || 0) - (remainingAmount ?? 0);

        setRemainingBalance(newRemainingBalance);

        // Handle overpayment if the paymentAmount is fully allocated
        if (remainingPayment < 0) {
          setOverpaymentAmount(-remainingPayment); // Record overpayment
        }
      } else {
        reducePayment && setRemainingBalance((item) => item + reducePayment);
        const totalAllocated = Object.values(paymentAllocation).reduce(
          (sum, value) => sum + value,
          0
        );
        setRemainingBalance(
          balanceSummary?.outstanding_balance ?? 0 - totalAllocated
        );
        setPaymentAllocation((prevAllocation) => {
          const { [invoiceId]: _, ...rest } = prevAllocation;
          return rest;
        });
        setUpdatedInvoices((prevInvoices) =>
          prevInvoices.filter((inv) => inv.id !== invoiceId)
        );
      }
    }
  };
  console.log(invoices, "invoice");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>New Credit</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Credit Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={date}
                  onSelect={setDate}
                // error={errors.date}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                // error={errors.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  // error={errors.client}
                  disabled={isClientLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isClientLoading ? "Loading clients..." : "Select client"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isClientLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.clientName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-center py-2 text-muted-foreground">
                        No clients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={handleInputChange}
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={creditType}
                onValueChange={(value) => setCreditType(value as CreditType)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="apply" id="apply" />
                  <Label htmlFor="apply">Apply to invoice(s)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="retain" id="retain" />
                  <Label htmlFor="retain">Retain as available credit</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {creditType === "apply" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Apply to Invoice</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : invoices.length > 0 ? (
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
                      <TableHead className="text-right">payment</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.created_at)}</TableCell>
                        <TableCell>{invoice.case_number}</TableCell>
                        <TableCell>{invoice.patient_name}</TableCell>
                        <TableCell className="text-right">
                          ${invoice.invoicesData[0].amount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          ${invoice.invoicesData[0].due_amount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(paymentAllocation[invoice.id] || 0)}
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
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No matching invoices.
                </div>
              )}
              {errors.invoices && (
                <p className="text-sm text-red-500">{errors.invoices}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
