import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Client, clientsService } from "@/services/clientsService";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface NewDebitModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
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

export function NewDebitModal({ onClose, onSubmit }: NewDebitModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [selectedClient, setSelectedClient] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [clients, setClients] = useState<Client[]>([]);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = "Date is required";
    if (!selectedClient) newErrors.client = "Client is required";
    if (!description) newErrors.description = "Description is required";
    if (!amount || amount <= 0) newErrors.amount = "Valid amount is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const debitData = {
        date,
        client_id: selectedClient,
        description,
        amount,
        type: "debit"
      };

      await onSubmit(debitData);
      toast.success("Debit created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating debit:", error);
      toast.error("Failed to create debit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>New Debit</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Debit Details</h3>
            
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
          </div>
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
