import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { getLabIdByUserId } from "@/services/authService";
import { BalanceTrackingItem } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for development
const mockStatements = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    statementNumber: "00032105",
    client: "Maine Street",
    amount: 470.0,
    outstandingAmount: 470.0,
    lastSent: new Date("2024-01-15"),
  },
  {
    id: "2",
    date: new Date("2024-01-10"),
    statementNumber: "00012105",
    client: "Test Client",
    amount: 1091.0,
    outstandingAmount: 676.0,
    lastSent: new Date("2024-01-12"),
  },
];

const StatementList = () => {
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [clientStatus, setClientStatus] = useState("active");
  const [balaceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useAuth();
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStatements(mockStatements.map((statement) => statement.id));
    } else {
      setSelectedStatements([]);
    }
  };

  const handleSelectStatement = (statementId: string) => {
    setSelectedStatements((prev) =>
      prev.includes(statementId)
        ? prev.filter((id) => id !== statementId)
        : [...prev, statementId]
    );
  };

  const clearClientFilter = () => {
    setClientFilter("");
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

  const filteredBalances: BalanceTrackingItem[] = balaceList.filter(
    (balance) => {
      const matchesSearch = balance.client_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // const matchesType =
      //   balanceType === "all" ||
      //   (balanceType === "outstanding" && balance.outstanding_balance > 0) ||
      //   (balanceType === "credit" && balance.credit > 0);
      return matchesSearch;
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
  console.log(totals, "totals");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search statements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {clientFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
              onClick={clearClientFilter}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={clientStatus} onValueChange={setClientStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Client Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Client</SelectItem>
            <SelectItem value="inactive">Inactive Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedStatements.length === mockStatements.length &&
                    mockStatements.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statement #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Outstanding Amount</TableHead>
              <TableHead>Last Sent</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockStatements.map((statement) => (
              <TableRow key={statement.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedStatements.includes(statement.id)}
                    onCheckedChange={() => handleSelectStatement(statement.id)}
                  />
                </TableCell>
                <TableCell>{format(statement.date, "dd/MM/yy")}</TableCell>
                <TableCell>
                  <Button variant="link" className="p-0">
                    {statement.statementNumber}
                  </Button>
                </TableCell>
                <TableCell>{statement.client}</TableCell>
                <TableCell className="text-right">
                  ${statement.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${statement.outstandingAmount.toFixed(2)}
                </TableCell>
                <TableCell>{format(statement.lastSent, "dd/MM/yy")}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Select defaultValue="20">
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">1-2 of 2</div>
      </div>
    </div>
  );
};

export default StatementList;
