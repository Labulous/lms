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
import { BalanceTrackingItem } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const ClientBalanceList = () => {
  // State
  const [balanceType, setBalanceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [balaceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuth();
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
              <TableHead className="text-center">Outstanding Balance</TableHead>
              <TableHead className="text-center">Credit Balance</TableHead>
              <TableHead className="text-center">This Month</TableHead>
              <TableHead className="text-center">Last Month</TableHead>
              <TableHead className="text-center">30+ Days</TableHead>
              <TableHead className="text-center">60+ Days</TableHead>
              <TableHead className="text-center">90+ Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBalances.map((balance) => (
              <TableRow key={balance.id}>
                <TableCell>{balance.client_name}</TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.outstanding_balance)}
                </TableCell>
                <TableCell className={`text-center`}>
                  <div
                    className={`${
                      balance.credit > 0
                        ? "bg-red-500 text-white my-0 h-12 flex justify-center items-center"
                        : ""
                    } text-center`}
                  >
                    {balance.credit ? formatCurrency(balance.credit) : 0}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.this_month)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.last_month)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.days_30_plus)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.days_60_plus)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.days_90_plus)}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={1}>Totals</TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.outstandingBalance)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.creditBalance)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.thisMonth)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.lastMonth)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.days30Plus)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.days60Plus)}
              </TableCell>
              <TableCell className="text-center">
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

export default ClientBalanceList;
