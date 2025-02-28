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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const BalanceList = () => {
  // State
  const [balanceType, setBalanceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [balaceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClientInvoices, setSelectedClientInvoices] = useState<any[]>([]);
  const [selectedClientName, setSelectedClientName] = useState("");
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
      thisMonth: 0,
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

  // Function to fetch client invoices
  const fetchClientInvoices = async (clientId: string, clientName: string) => {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .in("status", ["unpaid", "partially_paid"]);

      if (error) {
        console.error("Error fetching invoices:", error);
        return;
      }

      // Transform the data to ensure numeric values
      const transformedInvoices = invoices?.map(invoice => ({
        ...invoice,
        total_amount: Number(invoice.total_amount || 0),
        amount_paid: Number(invoice.amount_paid || 0),
        due_amount: Number(invoice.due_amount || 0)
      }));

      setSelectedClientInvoices(transformedInvoices || []);
      setSelectedClientName(clientName);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error fetching client invoices:", err);
    }
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
                  <button
                    onClick={() => fetchClientInvoices(balance.client_id, balance.client_name)}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {formatCurrency(balance.outstanding_balance)}
                  </button>
                </TableCell>
                <TableCell
                  className={`${
                    balance.credit > 0 ? "bg-red-500 text-white my-0 h-12 flex justify-center items-center" : ""
                  } text-center`}
                >
                  <div
                    className={`${
                      balance.credit > 0 ? "bg-red-500 text-white my-0 h-12 flex justify-center items-center" : ""
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

      {/* Invoice Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Outstanding Invoices - {selectedClientName}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClientInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount_paid)}</TableCell>
                    <TableCell>{formatCurrency(invoice.due_amount)}</TableCell>
                    {/* <TableCell>
                      {formatCurrency(invoice.total_amount - invoice.amount_paid)}
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BalanceList;
