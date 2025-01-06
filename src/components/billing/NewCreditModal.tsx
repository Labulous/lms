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
import { Client, clientsService } from "@/services/clientsService";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface NewCreditModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

type CreditType = "apply" | "retain";

interface Invoice {
  id: string;
  date: string;
  invoice_number: string;
  patient: string;
  original_amount: number;
  amount_due: number;
}

interface DatePickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
}

interface FormInputProps extends InputProps {
  error?: string;
}

interface FormSelectProps extends SelectProps {
  error?: string;
}

export function NewCreditModal({ onClose, onSubmit }: NewCreditModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [selectedClient, setSelectedClient] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<CreditType>("apply");
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsClientLoading(true);
        const data = await clientsService.getClients();
        if (Array.isArray(data)) {
          setClients(data);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setIsClientLoading(false);
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
        const { data, error } = await supabase
          .from("invoices")
          .select("id, created_at, invoice_number, amount, due_amount, cases!inner(patient_name)")
          .eq("client_id", selectedClient)
          .gt("due_amount", 0)
          .order("created_at");

        if (error) throw error;

        const formattedInvoices = data.map(invoice => ({
          id: invoice.id,
          date: new Date(invoice.created_at).toLocaleDateString(),
          invoice_number: invoice.invoice_number,
          patient: invoice.cases?.patient_name || "",
          original_amount: invoice.amount,
          amount_due: invoice.due_amount
        }));

        setInvoices(formattedInvoices);
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
    if (!amount || amount <= 0) newErrors.amount = "Valid amount is required";
    if (creditType === "apply" && selectedInvoices.length === 0) {
      newErrors.invoices = "Select at least one invoice";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const creditData = {
        date,
        client_id: selectedClient,
        description,
        amount,
        type: creditType,
        applied_invoices: creditType === "apply" ? selectedInvoices : [],
      };

      await onSubmit(creditData);
      toast.success("Credit created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating credit:", error);
      toast.error("Failed to create credit");
    } finally {
      setLoading(false);
    }
  };

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
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <DatePicker
                  date={date}
                  onChange={setDate}
                  error={errors.date}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={errors.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  error={errors.client}
                  disabled={isClientLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isClientLoading ? "Loading clients..." : "Select client"} />
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
                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  error={errors.amount}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
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
                      <TableHead className="text-right">Original Amount</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.patient}</TableCell>
                        <TableCell className="text-right">
                          ${invoice.original_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${invoice.amount_due.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.includes(invoice.id)}
                            onCheckedChange={(checked) => {
                              setSelectedInvoices(prev =>
                                checked
                                  ? [...prev, invoice.id]
                                  : prev.filter(id => id !== invoice.id)
                              );
                            }}
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
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
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
