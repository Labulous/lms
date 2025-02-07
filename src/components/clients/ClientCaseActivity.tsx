import { useState, useEffect, useMemo } from "react";
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
import { Plus, FileText, Loader2 } from "lucide-react";
import { format, isWithinInterval, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import CaseFilters from "../cases/CaseFilters";
import { Case, CaseFilters as ICaseFilters } from "@/types/supabase";

const logger = createLogger({ module: "ClientCaseActivity" });

interface ClientCaseActivityProps {
  clientId: string;
}

interface CaseStats {
  totalActive: number;
  dueSoon: number;
  averageDuration: number;
}

export function ClientCaseActivity({ clientId }: ClientCaseActivityProps) {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CaseStats>({
    totalActive: 0,
    dueSoon: 0,
    averageDuration: 0,
  });
  const [filters, setFilters] = useState<ICaseFilters>({
    dueDate: "",
    status: "",
    searchTerm: "",
  });

  // Fetch cases for the client
  const fetchClientCases = async () => {
    try {
      setLoading(true);
      const { data: casesData, error } = await supabase
        .from("cases")
        .select(`
          *,
          client:clients(id, client_name, phone),
          doctor:doctors(id, name, client:clients(id, client_name, phone))
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (casesData) {
        setCases(casesData);
        calculateStats(casesData);
      }
    } catch (error) {
      logger.error("Error fetching client cases:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from cases
  const calculateStats = (casesData: Case[]) => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const activeCases = casesData.filter((c) => c.status === "active");
    const dueSoonCases = casesData.filter((c) => {
      const dueDate = new Date(c.due_date);
      return dueDate >= now && dueDate <= weekFromNow;
    });

    const completedCases = casesData.filter((c) => c.status === "completed");
    const avgDuration =
      completedCases.length > 0
        ? completedCases.reduce((acc, c) => {
            const start = new Date(c.received_date || c.created_at);
            const end = new Date(c.ship_date || c.created_at);
            return acc + (end.getTime() - start.getTime());
          }, 0) / completedCases.length / (1000 * 60 * 60 * 24)
        : 0;

    setStats({
      totalActive: activeCases.length,
      dueSoon: dueSoonCases.length,
      averageDuration: Math.round(avgDuration),
    });
  };

  useEffect(() => {
    fetchClientCases();
  }, [clientId]);

  const filteredCases = useMemo(() => {
    return cases.filter((case_) => {
      // Apply status filter
      if (filters.status && case_.status !== filters.status.toLowerCase()) {
        return false;
      }

      // Apply due date filter
      if (filters.dueDate) {
        const dueDate = parseISO(case_.due_date);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const weekStart = startOfWeek(today);
        const weekEnd = endOfWeek(today);

        switch (filters.dueDate) {
          case "Today":
            if (!isWithinInterval(dueDate, { start: today, end: today })) {
              return false;
            }
            break;
          case "Tomorrow":
            if (!isWithinInterval(dueDate, { start: tomorrow, end: tomorrow })) {
              return false;
            }
            break;
          case "This Week":
            if (!isWithinInterval(dueDate, { start: weekStart, end: weekEnd })) {
              return false;
            }
            break;
        }
      }

      // Apply search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          case_.case_number.toLowerCase().includes(searchLower) ||
          case_.patient_name.toLowerCase().includes(searchLower) ||
          case_.doctor?.name.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [cases, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
  };

  // Loading component
  const LoadingState = () => (
    <div className="space-y-6">
      {/* Stats Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 animate-pulse rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 animate-pulse rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Loading */}
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    </div>
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActive}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueSoon}</div>
            <p className="text-xs text-muted-foreground">
              Cases due in the next 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDuration} days</div>
            <p className="text-xs text-muted-foreground">
              Average case completion time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <CaseFilters
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />
        <Button
          onClick={() => navigate("/cases/new")}
          className="ml-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> New Case
        </Button>
      </div>

      {/* Cases Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No cases found
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((case_) => (
                <TableRow key={case_.id}>
                  <TableCell className="font-medium">
                    {case_.case_number}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "bg-opacity-10",
                        case_.status === "active" && "bg-green-500 text-green-700",
                        case_.status === "completed" && "bg-blue-500 text-blue-700",
                        case_.status === "on_hold" && "bg-yellow-500 text-yellow-700"
                      )}
                    >
                      {case_.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{case_.doctor?.name || "N/A"}</TableCell>
                  <TableCell>
                    {case_.due_date
                      ? format(new Date(case_.due_date), "MMM d, yyyy")
                      : "TBD"}
                  </TableCell>
                  <TableCell>{case_.patient_name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/cases/${case_.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
