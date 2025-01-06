import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import CaseFilters from "./CaseFilters";
import PrintButtonWithDropdown from "./PrintButtonWithDropdown";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { CaseStatus, CASE_STATUS_DESCRIPTIONS } from "@/types/supabase";
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
  getPaginationRowModel,
  PaginationState,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/ui/page-header";

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
  const [statusFilter, setStatusFilter] = useState<CaseStatus[]>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const columns: ColumnDef<Case>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "case_number",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Case #
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          to={`/cases/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("case_number")}
        </Link>
      ),
    },
    {
      accessorKey: "patient_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Patient Name
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{row.getValue("patient_name")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 hover:bg-transparent"
            >
              <div className="flex items-center">
                Status
                <ChevronsUpDown className="ml-2 h-4 w-4" />
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {statusFilter.length}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b">
                <span className="text-sm font-medium">Filter by Status</span>
                {statusFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter([])}
                    className="h-8 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {["in_queue", "in_progress", "on_hold", "completed", "cancelled"].map(
                (status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={statusFilter.includes(status as CaseStatus)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter((prev) => [...prev, status as CaseStatus]);
                        } else {
                          setStatusFilter((prev) =>
                            prev.filter((s) => s !== status)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="flex items-center text-sm font-medium capitalize cursor-pointer"
                    >
                      <Badge
                        className={cn(
                          "bg-opacity-10 capitalize hover:bg-opacity-10 hover:text-inherit",
                          {
                            "bg-neutral-500 text-neutral-500 hover:bg-neutral-500": status === "in_queue",
                            "bg-blue-500 text-blue-500 hover:bg-blue-500": status === "in_progress",
                            "bg-yellow-500 text-yellow-500 hover:bg-yellow-500": status === "on_hold",
                            "bg-green-500 text-green-500 hover:bg-green-500": status === "completed",
                            "bg-red-500 text-red-500 hover:bg-red-500": status === "cancelled"
                          }
                        )}
                      >
                        {status.replace("_", " ")}
                      </Badge>
                    </label>
                  </div>
                )
              )}
            </div>
          </PopoverContent>
        </Popover>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusLower = status.toLowerCase() as CaseStatus;
        return (
          <TooltipProvider key={row.id}>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  className={cn(
                    "bg-opacity-10 capitalize hover:bg-opacity-10 hover:text-inherit",
                    {
                      "bg-neutral-500 text-neutral-500 hover:bg-neutral-500": statusLower === "in_queue",
                      "bg-blue-500 text-blue-500 hover:bg-blue-500": statusLower === "in_progress",
                      "bg-yellow-500 text-yellow-500 hover:bg-yellow-500": statusLower === "on_hold",
                      "bg-green-500 text-green-500 hover:bg-green-500": statusLower === "completed",
                      "bg-red-500 text-red-500 hover:bg-red-500": statusLower === "cancelled"
                    }
                  )}
                >
                  {status}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {CASE_STATUS_DESCRIPTIONS[statusLower]}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      filterFn: (row, id, value: CaseStatus[]) => {
        if (value.length === 0) return true;
        const status = (row.getValue(id) as string).toLowerCase() as CaseStatus;
        return value.includes(status);
      },
    },
    {
      accessorKey: "doctor",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Doctor
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const doctor = row.getValue("doctor") as { name: string } | null;
        return <div>{doctor?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "client",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Client
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const client = row.getValue("client") as { client_name: string } | null;
        return <div>{client?.client_name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Due Date
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string;
        return date ? format(new Date(date), "MMM d, yyyy") : "TBD";
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Ordered Date
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return <div>{format(new Date(date), "MM/dd/yyyy")}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <Link to={`/cases/${row.original.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </Link>
            <Link to={`/cases/${row.original.id}/edit`}>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePrint(row.original)}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: cases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  useEffect(() => {
    if (statusFilter.length > 0) {
      table.getColumn("status")?.setFilterValue(statusFilter);
    } else {
      table.getColumn("status")?.setFilterValue(undefined);
    }
  }, [statusFilter]);

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

  const handlePrint = (selectedRows: Row<Case>[]) => {
    console.log("Printing selected rows:", selectedRows);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Cases"
        description="View and manage all your dental lab cases."
      >
        <Button onClick={() => navigate("/cases/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Case
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Filter cases..."
              value={(table.getColumn("case_number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("case_number")?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <PrintButtonWithDropdown selectedRows={table.getSelectedRowModel().rows} />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap bg-muted hover:bg-muted"
                    >
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
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseList;
