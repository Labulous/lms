import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import CaseFilters from "./CaseFilters";
import PrintButtonWithDropdown from "./PrintButtonWithDropdown";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { format, isEqual, parseISO, isValid } from "date-fns";
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
import { Plus } from "lucide-react";
import { getLabIdByUserId } from "@/services/authService";

const logger = createLogger({ module: "CaseList" });

type Case = Database["public"]["Tables"]["cases"]["Row"] & {
  client: {
    id: string;
    name: string;
  };
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

  useEffect(() => {
    const getLabId = async () => {
      try {
        const data = await getLabIdByUserId(user?.id as string);
        setLabId(data?.labId as string);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        console.log("done");
      }
    };
    getLabId();
  }, []);
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
      accessorKey: "id",
      header: "Invoice ID",
      cell: ({ row }) => (
        <div className="font-semibold">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "patient_name",
      header: "Patient",
      cell: ({ row }) => <div>{row.getValue("patient_name") || "N/A"}</div>,
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => {
        const client = row.getValue("client") as { client_name: string } | null;
        return <div>{client?.client_name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "doctor",
      header: "Doctor",
      cell: ({ row }) => {
        const doctor = row.getValue("doctor") as { name: string } | null;
        return <div>{doctor?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              status === "Completed"
                ? "bg-green-100 text-green-800"
                : status === "In Progress"
                ? "bg-blue-100 text-blue-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const caseId = row.original.id;
        return (
          <div className="space-x-4">
            <Link
              to={`/cases/${caseId}`}
              className="text-indigo-600 hover:text-indigo-900"
            >
              View
            </Link>
            <Link
              to={`/cases/${caseId}/edit`}
              className="text-indigo-600 hover:text-indigo-900"
            >
              Edit
            </Link>
          </div>
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

        logger.debug("Starting case fetch with user:", {
          userId: user.id,
          role: user.role,
          email: user.email,
        });

        // First verify the user's session
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

        logger.debug("Current session:", {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
          expires_at: session.expires_at,
        });

        // Then fetch all cases
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
          client:clients!client_id (
            id,
            client_name,
            phone
          ),
          doctor:doctors!doctor_id (
            id,
            name,
            client:clients!client_id (
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
          enclosed_items:enclosed_case!enclosed_case_id (
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
          product_ids:case_products!id (
            products_id,
            id
          )
          `
          )
          .eq("lab_id", labId) // Filter by lab_id
          .order("created_at", { ascending: false });

        logger.debug("All cases query:", {
          data: casesData,
          error: casesError?.message,
          details: casesError?.details,
          hint: casesError?.hint,
        });

        if (casesError) {
          throw casesError;
        }

        if (!casesData || casesData.length === 0) {
          logger.debug("No cases found");
          setCases([]);
          setFilteredCases([]);
          setLoading(false);
          return;
        }
        setLoading(false);

        setCases(casesData as unknown as Case[]);
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
          const caseDate = format(parseISO(caseItem.due_date), "yyyy-MM-dd");
          return caseDate === dueDateParam;
        });
      }

      setFilteredCases(filtered);
    }
  }, [cases, searchParams]);

  const handleFilterChange = (filters: any) => {
    let filtered = [...cases];

    if (filters.dueDate) {
      const today = new Date();
      filtered = filtered.filter((caseItem) => {
        const dueDate = parseISO(caseItem.due_date);
        return isValid(dueDate) && isEqual(dueDate, today);
      });
    }

    if (filters.status) {
      filtered = filtered.filter(
        (caseItem) => caseItem.status === filters.status
      );
    }

    setFilteredCases(filtered);
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = cases.filter(
      (caseItem) =>
        caseItem.client.client_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        caseItem.patient_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        caseItem.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCases(filtered);
  };

  const handlePrintOptionSelect = (option: string) => {
    const selectedIds = Object.keys(rowSelection);
    logger.debug(`Print option selected: ${option} for cases:`, selectedIds);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return "Invalid Date";
      }
      return format(date, "MMM d, yyyy");
    } catch (err) {
      logger.error("Error formatting date:", err);
      return "Invalid Date";
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading cases...</div>;
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const dueDateParam = searchParams.get("dueDate");
  const headerText =
    dueDateParam && isValid(parseISO(dueDateParam))
      ? `Cases Due on ${format(parseISO(dueDateParam), "MMMM d, yyyy")}`
      : "Case Management";
  return (
    <div className="container mx-auto px-4 py-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">{headerText}</h1>
        <Button
          onClick={() => navigate("/cases/new")}
          className="inline-flex items-center"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add New Case
        </Button>
      </div>

      <CaseFilters
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      <div className="mb-4">
        <PrintButtonWithDropdown
          caseId=""
          onPrintOptionSelect={handlePrintOptionSelect}
          disabled={Object.keys(rowSelection).length === 0}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
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
