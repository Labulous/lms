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
import { getLabIdByUserId } from "@/services/authService";
import { BalanceTrackingItem } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import BalanceList from "./BalanceList";
import { isValid, parseISO, format } from "date-fns";
import { formatDate } from "@/lib/formatedDate";

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

interface StatementList {
  statement: {
    id: string;
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
    client: { client_name: string };
    statement_number: number; // Typically formatted as YYYYMMDD
    amount: number;
    outstanding: number;
    last_sent: string; // ISO timestamp
  }[];
}

const StatementList = ({ statement }: StatementList) => {
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [clientStatus, setClientStatus] = useState("active");

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
            {statement.map((statement) => (
              <TableRow key={statement.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedStatements.includes(statement.id)}
                    onCheckedChange={() => handleSelectStatement(statement.id)}
                  />
                </TableCell>
                <TableCell>{formatDate(statement.created_at)}</TableCell>
                <TableCell>
                  <Button variant="link" className="p-0">
                    {statement.statement_number}
                  </Button>
                </TableCell>
                <TableCell>{statement.client.client_name}</TableCell>
                <TableCell className="text-right">
                  ${statement.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${statement.outstanding.toFixed(2)}
                </TableCell>
                <TableCell>{formatDate(statement.last_sent)}</TableCell>
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
