import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { createLogger } from "@/utils/logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Loader2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const logger = createLogger({ module: "ClientBillingActivity" });

interface ClientBillingActivityProps {
  clientId: string;
}

interface Invoice {
  id: string;
  created_at: string;
  due_date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  invoice_number: string;
  case_id: string;
  case: {
    case_number: string;
    patient_name: string;
  };
}

interface BillingStats {
  totalOutstanding: number;
  overdue: number;
  averagePaymentTime: number;
}

export function ClientBillingActivity({ clientId }: ClientBillingActivityProps) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats>({
    totalOutstanding: 0,
    overdue: 0,
    averagePaymentTime: 0,
  });

  // Add a helper function for safe date formatting
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (error) {
      return 'N/A';
    }
  };

  // Add a helper function for safe amount formatting
  const formatAmount = (amount: number | null | undefined): string => {
    const validAmount = typeof amount === 'number' ? amount : 0;
    return validAmount.toFixed(2);
  };

  // Fetch invoices for the client
  const fetchClientInvoices = async () => {
    try {
      setLoading(true);
      const { data: invoicesData, error } = await supabase
        .from("invoices")
        .select(`
          *,
          case:cases(case_number, patient_name)
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (invoicesData) {
        const now = new Date().toISOString();
        // Transform the data to ensure valid values
        const transformedInvoices = invoicesData.map((invoice) => ({
          ...invoice,
          amount: typeof invoice.amount === 'number' ? invoice.amount : 0,
          created_at: invoice.created_at || now,
          due_date: invoice.due_date || now,
          status: invoice.status && ["paid", "pending", "overdue"].includes(invoice.status)
            ? invoice.status as Invoice["status"]
            : "pending",
          case: invoice.case || { case_number: "N/A", patient_name: "N/A" },
        }));
        setInvoices(transformedInvoices);
        calculateStats(transformedInvoices);
      }
    } catch (error) {
      logger.error("Error fetching client invoices:", error);
      // Set empty state on error
      setInvoices([]);
      setStats({
        totalOutstanding: 0,
        overdue: 0,
        averagePaymentTime: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate billing statistics with null checks
  const calculateStats = (invoicesData: Invoice[]) => {
    const outstanding = invoicesData
      .filter((i) => i.status !== "paid")
      .reduce((sum, invoice) => {
        const amount = typeof invoice.amount === 'number' ? invoice.amount : 0;
        return sum + amount;
      }, 0);

    const overdueInvoices = invoicesData.filter(
      (i) => i.status === "overdue"
    ).length;

    // Calculate average payment time for paid invoices
    const paidInvoices = invoicesData.filter((i) => i.status === "paid");
    const avgPaymentTime =
      paidInvoices.length > 0
        ? paidInvoices.reduce((acc, invoice) => {
            const created = new Date(invoice.created_at || new Date());
            const paid = new Date(invoice.due_date || new Date());
            return acc + (paid.getTime() - created.getTime());
          }, 0) / paidInvoices.length / (1000 * 60 * 60 * 24)
        : 0;

    setStats({
      totalOutstanding: outstanding,
      overdue: overdueInvoices,
      averagePaymentTime: Math.round(avgPaymentTime),
    });
  };

  useEffect(() => {
    fetchClientInvoices();
  }, [clientId]);

  const getStatusBadge = (status: Invoice["status"]) => {
    // Default status if undefined or invalid
    const validStatus = status && ["paid", "pending", "overdue"].includes(status)
      ? status
      : "pending";

    const statusConfig = {
      paid: { class: "bg-green-100 text-green-800", label: "Paid" },
      pending: { class: "bg-yellow-100 text-yellow-800", label: "Pending" },
      overdue: { class: "bg-red-100 text-red-800", label: "Overdue" },
    } as const;

    const config = statusConfig[validStatus];
    return (
      <Badge className={cn("font-medium", config.class)}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatAmount(stats.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Total unpaid invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Invoices past due date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Payment Time</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePaymentTime} days</div>
            <p className="text-xs text-muted-foreground">
              Average time to payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              View and manage client invoices
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {invoice.case.case_number}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {invoice.case.patient_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.created_at)}
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.due_date)}
                    </TableCell>
                    <TableCell>${formatAmount(invoice.amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientBillingActivity;
