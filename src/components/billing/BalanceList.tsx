import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BalanceTrackingItem } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Balance {
  id: string;
  client: string;
  outstandingBalance: number;
  creditBalance: number;
  thisMonth: number;
  lastMonth: number;
  days30Plus: number;
  days60Plus: number;
  days90Plus: number;
}

// Mock data
const mockBalances: Balance[] = [
  {
    id: "1",
    client: "Maine Street",
    outstandingBalance: 7059.0,
    creditBalance: 0.0,
    thisMonth: 6094.0,
    lastMonth: 495.0,
    days30Plus: 0.0,
    days60Plus: 0.0,
    days90Plus: 470.0,
  },
  {
    id: "2",
    client: "Test Client",
    outstandingBalance: 4411.6,
    creditBalance: 200.0,
    thisMonth: 2365.6,
    lastMonth: 1470.0,
    days30Plus: 0.0,
    days60Plus: 0.0,
    days90Plus: 776.0,
  },
  {
    id: "3",
    client: "Doctor, Test",
    outstandingBalance: 1600.0,
    creditBalance: 0.0,
    thisMonth: 1600.0,
    lastMonth: 0.0,
    days30Plus: 0.0,
    days60Plus: 0.0,
    days90Plus: 0.0,
  },
];

const BalanceList = () => {
  // State
  const [balanceType, setBalanceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [balaceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuth();
  // Filter balances based on search query and balance type
  const filteredBalances: BalanceTrackingItem[] = balaceList.filter(
    (balance) => {
      const matchesSearch = balance.client_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        balanceType === "all" ||
        (balanceType === "outstanding" && balance.outstanding_balance > 0) ||
        (balanceType === "credit" && balance.credit > 0);
      return matchesSearch && matchesType;
    }
  );

  // Calculate totals
  const totals = filteredBalances.reduce(
    (acc, balance) => ({
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
      outstandingBalance: 0,
      creditBalance: 0,
      thisMonth: 200,
      lastMonth: 0,
      days30Plus: 0,
      days60Plus: 0,
      days90Plus: 0,
    }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    const getPaymentList = async () => {
      setLoading(true);

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
              credit_balance,
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
          .eq("lab_id", lab.labId);

        if (balanceListError) {
          console.error("Error fetching products for case:", balanceListError);
          return;
        }

        console.log("balanceList (raw data)", balanceList);

        // Transform the data to align with the expected type
        const transformedBalanceList = balanceList?.map((balance: any) => ({
          ...balance,
          client_name: balance.clients?.client_name, // Directly access client_name
        }));

        setBalanceList(transformedBalanceList as BalanceTrackingItem[]);
      } catch (err) {
        console.error("Error fetching payment list:", err);
      } finally {
        setLoading(false);
      }
    };

    getPaymentList();
  }, []);
  console.log(balaceList, "list balance");
  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Outstanding Balance</TableHead>
              <TableHead className="text-right">Credit Balance</TableHead>
              <TableHead className="text-right">This Month</TableHead>
              <TableHead className="text-right">Last Month</TableHead>
              <TableHead className="text-right">30+ Days</TableHead>
              <TableHead className="text-right">60+ Days</TableHead>
              <TableHead className="text-right">90+ Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBalances.map((balance) => (
              <TableRow key={balance.id}>
                <TableCell>{balance.client_name}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance.outstanding_balance)}
                </TableCell>
                <TableCell className="text-right">
                  {balance.credit ? formatCurrency(balance.credit) : 0}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance.this_month)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance.last_month)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance.days_30_plus)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance.days_60_plus)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance.days_90_plus)}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={1}>Totals</TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.outstandingBalance)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.creditBalance)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.thisMonth)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.lastMonth)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.days30Plus)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.days60Plus)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.days90Plus)}
              </TableCell>
              <TableCell colSpan={1}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BalanceList;
