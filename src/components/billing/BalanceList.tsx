import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  financeCharge: number;
}

// Mock data
const mockBalances: Balance[] = [
  {
    id: "1",
    client: "Maine Street",
    outstandingBalance: 7059.00,
    creditBalance: 0.00,
    thisMonth: 6094.00,
    lastMonth: 495.00,
    days30Plus: 0.00,
    days60Plus: 0.00,
    days90Plus: 470.00,
    financeCharge: 482.50,
  },
  {
    id: "2",
    client: "Test Client",
    outstandingBalance: 4411.60,
    creditBalance: 200.00,
    thisMonth: 2365.60,
    lastMonth: 1470.00,
    days30Plus: 0.00,
    days60Plus: 0.00,
    days90Plus: 776.00,
    financeCharge: 0.00,
  },
  {
    id: "3",
    client: "Doctor, Test",
    outstandingBalance: 1600.00,
    creditBalance: 0.00,
    thisMonth: 1600.00,
    lastMonth: 0.00,
    days30Plus: 0.00,
    days60Plus: 0.00,
    days90Plus: 0.00,
    financeCharge: 0.00,
  },
];

const BalanceList = () => {
  // State
  const [selectedBalances, setSelectedBalances] = useState<string[]>([]);
  const [balanceType, setBalanceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter balances based on search query and balance type
  const filteredBalances = mockBalances.filter(balance => {
    const matchesSearch = balance.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = balanceType === "all" || 
      (balanceType === "outstanding" && balance.outstandingBalance > 0) ||
      (balanceType === "credit" && balance.creditBalance > 0);
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totals = filteredBalances.reduce((acc, balance) => ({
    outstandingBalance: acc.outstandingBalance + balance.outstandingBalance,
    creditBalance: acc.creditBalance + balance.creditBalance,
    thisMonth: acc.thisMonth + balance.thisMonth,
    lastMonth: acc.lastMonth + balance.lastMonth,
    days30Plus: acc.days30Plus + balance.days30Plus,
    days60Plus: acc.days60Plus + balance.days60Plus,
    days90Plus: acc.days90Plus + balance.days90Plus,
    financeCharge: acc.financeCharge + balance.financeCharge,
  }), {
    outstandingBalance: 0,
    creditBalance: 0,
    thisMonth: 0,
    lastMonth: 0,
    days30Plus: 0,
    days60Plus: 0,
    days90Plus: 0,
    financeCharge: 0,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <Select value={balanceType} onValueChange={setBalanceType}>
              <SelectTrigger className={cn(
                "w-[180px]",
                balanceType !== "all" && "bg-blue-50 border-blue-600 hover:bg-blue-100"
              )}>
                <SelectValue placeholder="Outstanding Balance" />
                {balanceType !== "all" && (
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full z-10"
                    onClick={() => setBalanceType("all")}
                  >
                    <X size={14} className="text-red-500 hover:text-red-600" />
                  </button>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Balances</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedBalances.length === filteredBalances.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBalances(filteredBalances.map(b => b.id));
                    } else {
                      setSelectedBalances([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Outstanding Balance</TableHead>
              <TableHead className="text-right">Credit Balance</TableHead>
              <TableHead className="text-right">This Month</TableHead>
              <TableHead className="text-right">Last Month</TableHead>
              <TableHead className="text-right">30+ Days</TableHead>
              <TableHead className="text-right">60+ Days</TableHead>
              <TableHead className="text-right">90+ Days</TableHead>
              <TableHead className="text-right">Finance Charge</TableHead>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead className="w-[30px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBalances.map((balance) => (
              <TableRow key={balance.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedBalances.includes(balance.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBalances([...selectedBalances, balance.id]);
                      } else {
                        setSelectedBalances(selectedBalances.filter(id => id !== balance.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{balance.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.outstandingBalance)}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.creditBalance)}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.thisMonth)}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.lastMonth)}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.days30Plus)}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.days60Plus)}</TableCell>
                <TableCell className="text-right">{formatCurrency(balance.days90Plus)}</TableCell>
                <TableCell className="text-right text-blue-600">{formatCurrency(balance.financeCharge)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Checkbox />
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={2}>Totals</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.outstandingBalance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.creditBalance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.thisMonth)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.lastMonth)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days30Plus)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days60Plus)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days90Plus)}</TableCell>
              <TableCell className="text-right text-blue-600">{formatCurrency(totals.financeCharge)}</TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BalanceList;
