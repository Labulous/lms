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
import { BalanceSummary } from "@/pages/billing/Statements";
import { Loader2 } from "lucide-react";
import { getLabIdByUserId } from "@/services/authService";
import { BalanceTrackingItem } from "@/types/supabase";

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

export function CreateStatementModal({
  onClose,
  onSubmit,
}: CreateStatementModalProps) {
  const [availableMonths, setAvailableMonths] = useState<
    { name: string; month: number; year: number }[]
  >([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [balanceSummaryRemoved, setBalanceSummary] = useState<MonthlyBalance>({
    month: "",
    thisMonth: 0,
    lastMonth: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    credit: 0,
    outstandingBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [balanceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useAuth();
  // Helper function to animate value changes
  const AnimatedValue = ({
    value,
    prefix = "$",
  }: {
    value: number;
    prefix?: string;
  }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      setHasChanged(true);
      const timeout = setTimeout(() => setHasChanged(false), 300);

      // Animate to new value
      setDisplayValue(value);

      return () => clearTimeout(timeout);
    }, [value]);

    return (
      <span
        className={`transition-all duration-300 ${
          hasChanged ? "text-primary scale-110" : ""
        }`}
      >
        {prefix}
        {displayValue.toFixed(2)}
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

        // Extract unique months and map to the desired format
        const months = [
          ...new Map(
            payments?.map((payment) => {
              const date = new Date(payment.created_at);
              const month = date.getMonth() + 1; // JS months are 0-indexed
              const year = date.getFullYear();
              const name = format(date, "MMMM yyyy");

              return [`${month}-${year}`, { name, month, year }];
            })
          ).values(),
        ];

        setAvailableMonths(months);
      } catch (error) {
        console.error("Error fetching available months:", error);
        toast.error("Failed to load available months");
      }
    };

    fetchAvailableMonths();
  }, []);

  // Fetch balance summary for selected month

  // Handle month selection
  const handleMonthSelect = (monthYear: string) => {
    const month = monthYear.split(",")[0];
    const year = monthYear.split(",")[1];
    setSelectedMonth(monthYear);
    getBalanceSummary(Number(month), Number(year));
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
        summary: balanceSummary,
      });
      toast.success("Statement generated successfully");
      // onClose();
    } catch (error) {
      console.error("Error generating statement:", error);
      toast.error("Failed to generate statement");
    }
  };

  const getBalanceSummary = async (month: number, year: number) => {
    setLoading(true);

    const formattedYear = year < 100 ? 2000 + year : year;

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? formattedYear + 1 : formattedYear;

    try {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      const { data: balanceList, error: balanceListError } = await supabase
        .from("balance_tracking")
        .select(
          `
            created_at,
            client_id,
            outstanding_balance,
            credit,
            this_month,
            last_month,
            days_30_plus,
            days_60_plus,
            days_90_plus,
            total,
            lab_id,
            clients!client_id ( client_name )
            `
        )
        .eq("lab_id", lab.labId)
        .gte(
          "updated_at",
          `${formattedYear}-${String(month).padStart(2, "0")}-01`
        )
        .lt(
          "updated_at",
          `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
        );

      if (balanceListError) {
        console.error("Error fetching products for case:", balanceListError);
        return;
      }

      console.log("balanceList (raw data)", balanceList);

      const transformedBalanceList = balanceList?.map((balance: any) => ({
        ...balance,
        client_name: balance.clients?.client_name,
      }));

      setBalanceList(transformedBalanceList as BalanceTrackingItem[]);
    } catch (err) {
      console.error("Error fetching payment list:", err);
    } finally {
      setLoading(false);
    }
  };

  // Use a valid year (e.g., 2024) instead of 24

  const filteredBalances: BalanceTrackingItem[] = balanceList.filter(
    (balance) => {
      const matchesSearch = balance.client_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    }
  );

  // Calculate totals
  const balanceSummary = filteredBalances.reduce(
    (acc, balance) => ({
      totalItems: acc.totalItems + 1, // Count the total number of items
      outstandingBalance: acc.outstandingBalance + balance.outstanding_balance,
      creditBalance:
        acc.creditBalance +
        (typeof balance?.credit === "number" ? balance.credit : 0),
      thisMonth: acc.thisMonth + balance.this_month,
      lastMonth: acc.lastMonth + balance.last_month,
      days30Plus: acc.days30Plus + balance.days_30_plus,
      days60Plus: acc.days60Plus + balance.days_60_plus,
      days90Plus: acc.days90Plus + balance.days_90_plus,
    }),
    {
      totalItems: 0,
      outstandingBalance: 0,
      creditBalance: 0,
      thisMonth: 0,
      lastMonth: 0,
      days30Plus: 0,
      days60Plus: 0,
      days90Plus: 0,
    }
  );

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
            <Select value={selectedMonth} onValueChange={handleMonthSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month, key) => (
                  <SelectItem key={key} value={`${month.month},${month.year}`}>
                    {month.name}
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
                  <div className="text-sm text-muted-foreground">
                    This Month:
                  </div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.thisMonth} />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Last Month:
                  </div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.lastMonth} />
                  </div>

                  <div className="text-sm text-muted-foreground">30+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days30Plus} />
                  </div>

                  <div className="text-sm text-muted-foreground">60+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days60Plus} />
                  </div>

                  <div className="text-sm text-muted-foreground">90+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days90Plus} />
                  </div>

                  <div className="text-sm text-muted-foreground">Credit:</div>
                  <div className="text-sm font-medium text-right text-green-600">
                    <AnimatedValue value={balanceSummary.creditBalance} />
                  </div>

                  <div className="text-base font-medium pt-2 border-t">
                    Outstanding Balance:
                  </div>
                  <div className="text-base font-medium text-right pt-2 border-t">
                    <AnimatedValue value={balanceSummary.outstandingBalance} />
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
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
