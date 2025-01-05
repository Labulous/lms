import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Mail,
  MoreVertical,
  Search,
  Trash,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import cn from "classnames";

interface Payment {
  id: string;
  date: string;
  client: string;
  paymentMethod: "Check" | "Credit Card" | "Bank Transfer" | "Cash" | "Other";
  memo: string;
  amount: number;
  applied: number;
  unapplied: number;
}

// Mock data
const mockPayments: Payment[] = [
  {
    id: "1",
    date: "2023-12-21",
    client: "Dental Clinic A",
    paymentMethod: "Credit Card",
    memo: "December Invoice Payment",
    amount: 1500.0,
    applied: 1500.0,
    unapplied: 0,
  },
  {
    id: "2",
    date: "2023-12-20",
    client: "Dental Clinic B",
    paymentMethod: "Check",
    memo: "Partial Payment",
    amount: 2000.0,
    applied: 1800.0,
    unapplied: 200.0,
  },
];

const PaymentList = () => {
  // State
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange>();
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const activeSelectStyles = "bg-blue-50 border-blue-600 hover:bg-blue-100";

  const getFilteredPayments = () => {
    let filtered = [...mockPayments];

    if (dateRange && dateRange.from !== undefined) {
      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.date);
        if (dateRange.to) {
          return dateRange.from
            ? paymentDate >= dateRange.from && paymentDate <= dateRange.to
            : null;
        }
        return dateRange.from ? paymentDate >= dateRange?.from : null;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((payment) =>
        Object.values(payment).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (paymentMethod !== "all") {
      filtered = filtered.filter(
        (payment) => payment.paymentMethod === paymentMethod
      );
    }

    if (paymentStatus !== "all") {
      filtered = filtered.filter((payment) => {
        if (paymentStatus === "applied") {
          return payment.applied > 0;
        } else if (paymentStatus === "unapplied") {
          return payment.unapplied > 0;
        }
        return true;
      });
    }

    return filtered;
  };

  // Sorting
  const handleSort = (key: keyof Payment) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: keyof Payment) => {
    if (sortConfig.key !== key)
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const sortedPayments = [...getFilteredPayments()].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
  const paginatedPayments = sortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <div className="relative">
            <div className="relative inline-block">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger
                  className={cn(
                    "w-[180px]",
                    paymentMethod !== "all" && activeSelectStyles
                  )}
                >
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod !== "all" && (
                <button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full z-10"
                  onClick={() => setPaymentMethod("all")}
                >
                  <X size={14} className="text-red-500 hover:text-red-600" />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="relative inline-block">
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger
                  className={cn(
                    "w-[180px]",
                    paymentStatus !== "all" && activeSelectStyles
                  )}
                >
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="unapplied">Unapplied</SelectItem>
                </SelectContent>
              </Select>
              {paymentStatus !== "all" && (
                <button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full z-10"
                  onClick={() => setPaymentStatus("all")}
                >
                  <X size={14} className="text-red-500 hover:text-red-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {selectedPayments.length > 0 && (
            <>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </>
          )}
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    paginatedPayments.length > 0 &&
                    paginatedPayments.every((payment) =>
                      selectedPayments.includes(payment.id)
                    )
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPayments(paginatedPayments.map((p) => p.id));
                    } else {
                      setSelectedPayments([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead
                onClick={() => handleSort("date")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Date
                  {getSortIcon("date")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("client")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Client
                  {getSortIcon("client")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("paymentMethod")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Payment Method
                  {getSortIcon("paymentMethod")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("memo")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Memo
                  {getSortIcon("memo")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("amount")}
                className="cursor-pointer text-right"
              >
                <div className="flex items-center justify-end">
                  Amount
                  {getSortIcon("amount")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("applied")}
                className="cursor-pointer text-right"
              >
                <div className="flex items-center justify-end">
                  Applied
                  {getSortIcon("applied")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("unapplied")}
                className="cursor-pointer text-right"
              >
                <div className="flex items-center justify-end">
                  Unapplied
                  {getSortIcon("unapplied")}
                </div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPayments.includes(payment.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPayments((prev) => [...prev, payment.id]);
                      } else {
                        setSelectedPayments((prev) =>
                          prev.filter((id) => id !== payment.id)
                        );
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(payment.date), "dd/MM/yy")}
                </TableCell>
                <TableCell>{payment.client}</TableCell>
                <TableCell>
                  <Badge variant="outline">{payment.paymentMethod}</Badge>
                </TableCell>
                <TableCell>{payment.memo}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(payment.applied)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(payment.unapplied)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Email Receipt</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, sortedPayments.length)} of{" "}
          {sortedPayments.length} payments
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentList;
