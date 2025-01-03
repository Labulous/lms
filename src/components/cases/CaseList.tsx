import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import CaseFilters from "./CaseFilters";
import PrintButtonWithDropdown from "./PrintButtonWithDropdown";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/utils/logger";
import { 
  Plus, 
  ChevronsUpDown, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  PrinterIcon 
} from "lucide-react";
import { getLabIdByUserId } from "@/services/authService";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const logger = createLogger({ module: "CaseList" });

type Case = {
  id: string;
  created_at: string;
  received_date: string | null;
  ship_date: string | null;
  status: string;
  patient_name: string;
  due_date: string;
  case_number: string;
  client: {
    id: string;
    client_name: string;
    phone: string | null;
  } | null;
  doctor: {
    id: string;
    name: string;
    client: {
      id: string;
      client_name: string;
      phone: string | null;
    } | null;
  } | null;
  pan_number: string | null;
  rx_number: string | null;
  isDueDateTBD: boolean;
  appointment_date: string | null;
  otherItems: string | null;
  lab_notes: string | null;
  technician_notes: string | null;
  occlusal_type: string | null;
  contact_type: string | null;
  pontic_type: string | null;
  custom_contact_details: string | null;
  custom_occulusal_details: string | null;
  custom_pontic_details: string | null;
  enclosed_items: {
    impression: boolean;
    biteRegistration: boolean;
    photos: boolean;
    jig: boolean;
    opposingModel: boolean;
    articulator: boolean;
    returnArticulator: boolean;
    cadcamFiles: boolean;
    consultRequested: boolean;
    user_id: string;
  } | null;
  product_ids: {
    products_id: string[];
    id: string;
  }[] | null;
};

const CaseList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [labId, setLabId] = useState<string | null>(null);

  const columns: ColumnDef<Case>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "case_number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Case Number
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("case_number")}</div>,
    },
    {
      accessorKey: "patient_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Patient Name
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("patient_name")}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Status
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            className={cn(
              "bg-opacity-10 capitalize",
              status === "completed" && "bg-green-500 text-green-500",
              status === "in_progress" && "bg-blue-500 text-blue-500",
              status === "pending" && "bg-yellow-500 text-yellow-500"
            )}
          >
            {status?.toLowerCase().replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "doctor",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Doctor
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const doctor = row.getValue("doctor") as { name: string } | null;
        return <div>{doctor?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "client",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Client
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const client = row.getValue("client") as { client_name: string } | null;
        return <div>{client?.client_name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Ordered Date
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return <div>{format(new Date(date), "MM/dd/yyyy")}</div>;
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Due Date
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string;
        return <div>{format(new Date(date), "MM/dd/yyyy")}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const caseId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/cases/${caseId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/cases/${caseId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredCases,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    const getLabId = async () => {
      try {
        const data = await getLabIdByUserId(user?.id as string);
        setLabId(data?.labId as string);
      } catch (error) {
        console.error("Error fetching lab ID:", error);
      }
    };
    getLabId();
  }, [user?.id]);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          logger.debug("No user found in auth context");
          setLoading(false);
          return;
        }

        if (!user.id || !user.role) {
          logger.error("User missing required fields", {
            hasId: !!user.id,
            hasRole: !!user.role,
          });
          throw new Error("User is missing required fields");
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          logger.error("No active session");
          throw new Error("No active session");
        }

        const { data: casesData, error: casesError } = await supabase
          .from("cases")
          .select(
            `
            id,
            created_at,
            received_date,
            ship_date,
            status,
            patient_name,
            due_date,
            case_number,
            client:clients (
              id,
              client_name,
              phone
            ),
            doctor:doctors (
              id,
              name,
              client:clients (
                id,
                client_name,
                phone
              )
            ),
            pan_number,
            rx_number,
            isDueDateTBD,
            appointment_date,
            otherItems,
            lab_notes,
            technician_notes,
            occlusal_type,
            contact_type,
            pontic_type,
            custom_contact_details,
            custom_occulusal_details,
            custom_pontic_details,
            enclosed_items:enclosed_case (
              impression,
              biteRegistration,
              photos,
              jig,
              opposingModel,
              articulator,
              returnArticulator,
              cadcamFiles,
              consultRequested,
              user_id
            ),
            product_ids:case_products (
              products_id,
              id
            )
            `
          )
          .eq("lab_id", labId)
          .order("created_at", { ascending: false });

        if (casesError) {
          throw casesError;
        }

        if (!casesData) {
          setCases([]);
          setFilteredCases([]);
          return;
        }

        setCases(casesData as unknown as Case[]);
        setFilteredCases(casesData as unknown as Case[]);
      } catch (err) {
        logger.error("Error fetching cases:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch cases");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && labId) {
      fetchCases();
    }
  }, [user, authLoading, labId]);

  useEffect(() => {
    if (cases.length > 0) {
      let filtered = [...cases];
      const dueDateParam = searchParams.get("dueDate");

      if (dueDateParam) {
        filtered = filtered.filter((caseItem) => {
          const caseDate = format(new Date(caseItem.due_date), "yyyy-MM-dd");
          return caseDate === dueDateParam;
        });
      }

      setFilteredCases(filtered);
    }
  }, [cases, searchParams]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="w-full space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cases</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigate("/cases/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Case
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No cases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CaseList;
