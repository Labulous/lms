import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface CreateStatementModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface MonthlyBalance {
  month: string;
  thisMonth: number;
  lastMonth: number;
  days30: number;
  days60: number;
  days90: number;
  credit: number;
  outstandingBalance: number;
}

interface GenericStringError {
  [key: string]: string;
}

interface StatementError extends GenericStringError {
  created_at?: string;
  due_amount?: string;
  status?: string;
  amount?: string;
}

export function CreateStatementModal({ onClose, onSubmit }: CreateStatementModalProps) {
  const { user } = useAuth();
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [balanceSummary, setBalanceSummary] = useState<MonthlyBalance>({
    month: "",
    thisMonth: 0,
    lastMonth: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    credit: 0,
    outstandingBalance: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  // Helper function to animate value changes
  const AnimatedValue = ({ value, prefix = "$" }: { value: number; prefix?: string }) => {
    const [displayValue, setDisplayValue] = useState(value);
    
    useEffect(() => {
      setHasChanged(true);
      const timeout = setTimeout(() => setHasChanged(false), 300);
      
      // Animate to new value
      setDisplayValue(value);
      
      return () => clearTimeout(timeout);
    }, [value]);

    return (
      <span className={`transition-all duration-300 ${hasChanged ? 'text-primary scale-110' : ''}`}>
        {prefix}{displayValue.toFixed(2)}
      </span>
    );
  };

  // Fetch months with payment activity
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const { data: payments, error } = await supabase
          .from("payments")
          .select("created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Extract unique months from payment dates
        const months = [...new Set(payments?.map(payment => 
          format(new Date(payment.created_at), "MMMM yyyy")
        ))];

        setAvailableMonths(months);
      } catch (error) {
        console.error("Error fetching available months:", error);
        toast.error("Failed to load available months");
      }
    };

    fetchAvailableMonths();
  }, []);

  // Fetch balance summary for selected month
  const fetchBalanceSummary = async (month: string) => {
    setIsLoading(true);
    try {
      const [monthName, year] = month.split(" ");
      const startDate = new Date(parseInt(year), new Date(monthName + " 1, 2000").getMonth(), 1);
      const endDate = new Date(parseInt(year), startDate.getMonth() + 1, 0);
      const lastMonthStart = new Date(startDate);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

      // Fetch all relevant data for the selected month
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          amount,
          due_amount,
          status,
          created_at,
          client (
            id
          )
        `)
        .eq("client_id", user.id);

      if (error) throw error;

      const summary: MonthlyBalance = {
        month,
        thisMonth: 0,
        lastMonth: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        credit: 0,
        outstandingBalance: 0
      };

      invoices?.forEach(invoice => {
        const createdDate = new Date(invoice.created_at);
        const daysDiff = Math.floor((endDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        if (createdDate >= startDate && createdDate < endDate) {
          summary.thisMonth += invoice.due_amount;
        } else if (createdDate >= lastMonthStart && createdDate < startDate) {
          summary.lastMonth += invoice.due_amount;
        }

        if (daysDiff <= 30) {
          summary.days30 += invoice.due_amount;
        } else if (daysDiff <= 60) {
          summary.days60 += invoice.due_amount;
        } else {
          summary.days90 += invoice.due_amount;
        }

        if (invoice.status === "credit") {
          summary.credit += invoice.amount;
        }
      });

      summary.outstandingBalance = summary.thisMonth + summary.lastMonth + summary.days30 + summary.days60 + summary.days90 - summary.credit;
      setBalanceSummary(summary);
    } catch (error) {
      console.error("Error fetching balance summary:", error);
      toast.error("Failed to load balance summary");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle month selection
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    fetchBalanceSummary(month);
  };

  // Handle statement generation
  const handleGenerateStatement = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    try {
      // TODO: Implement statement generation logic
      onSubmit({
        month: selectedMonth,
        summary: balanceSummary
      });
      toast.success("Statement generated successfully");
      onClose();
    } catch (error) {
      console.error("Error generating statement:", error);
      toast.error("Failed to generate statement");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Statement</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Column - Month Selection */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Select Month</div>
            <Select
              value={selectedMonth}
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500 mt-2">
              Only months with payment activity are shown
            </div>
          </div>

          {/* Right Column - Balance Summary */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Balance Summary</div>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3 bg-muted p-4 rounded-lg transition-all duration-200 hover:bg-muted/80">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm text-muted-foreground">This Month:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.thisMonth} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">Last Month:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.lastMonth} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">30+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days30} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">60+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days60} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">90+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days90} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">Credit:</div>
                  <div className="text-sm font-medium text-right text-green-600">
                    <AnimatedValue value={balanceSummary.credit} />
                  </div>
                  
                  <div className="text-base font-medium pt-2 border-t">Outstanding Balance:</div>
                  <div className="text-base font-medium text-right pt-2 border-t">
                    <AnimatedValue 
                      value={balanceSummary.outstandingBalance}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateStatement}
            disabled={!selectedMonth || isLoading}
            className="relative"
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Statement
            {hasChanged && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
