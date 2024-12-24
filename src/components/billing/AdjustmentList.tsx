import { useState } from "react";
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
import { format } from "date-fns";

// Mock data for development
const mockAdjustments = [
  {
    id: "1",
    date: new Date("2024-03-01"),
    client: "Doctor, Test",
    description: "test",
    creditAmount: 200.00,
    debitAmount: 0,
  },
  {
    id: "2",
    date: new Date("2023-12-19"),
    client: "Test Client",
    description: "test credit",
    creditAmount: 200.00,
    debitAmount: 320.00,
  },
];

const AdjustmentList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search adjustments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="60">Last 60 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Credit Amount</TableHead>
              <TableHead className="text-right">Debit Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAdjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>{format(adjustment.date, "dd/MM/yy")}</TableCell>
                <TableCell>{adjustment.client}</TableCell>
                <TableCell>{adjustment.description}</TableCell>
                <TableCell className="text-right">
                  {adjustment.creditAmount > 0 ? `($${adjustment.creditAmount.toFixed(2)})` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {adjustment.debitAmount > 0 ? `$${adjustment.debitAmount.toFixed(2)}` : "-"}
                </TableCell>
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
        <div className="text-sm text-muted-foreground">
          1-2 of 2
        </div>
      </div>
    </div>
  );
};

export default AdjustmentList;
