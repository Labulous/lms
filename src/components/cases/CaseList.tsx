import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { labDetail } from "@/types/supabase";
import { CaseStatus, CASE_STATUS_DESCRIPTIONS } from "@/types/supabase";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
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
  Row,
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
  PrinterIcon,
  FileText,
  Printer,
} from "lucide-react";
import { getLabDataByUserId } from "@/services/authService";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { PageHeader } from "@/components/ui/page-header";
import { shortMonths } from "@/lib/months";
import { ExtendedCase } from "./CaseDetails";
import { formatDateWithTime, formatDate } from "@/lib/formatedDate";

const logger = createLogger({ module: "CaseList" });

const CaseList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<ExtendedCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<ExtendedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [selectedRows, setSelectedRows] = useState<Row<ExtendedCase>[]>([]);
  const [lab, setLab] = useState<labDetail | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedCasesIds, setSelectedCases] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<CaseStatus[]>(() => {
    const statusParam = searchParams.get("status");
    return statusParam ? (statusParam.split(",") as CaseStatus[]) : [];
  });
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined>(() => {
    const dueDateParam = searchParams.get("dueDate");

    // Parse the date as UTC and return it, or undefined if no date is provided
    return dueDateParam ? new Date(Date.parse(dueDateParam)) : undefined;
  });

  const [tagFilter, setTagFilter] = useState<string[]>(() => {
    const tagParam = searchParams.get("tags");
    return tagParam ? tagParam.split(",") : [];
  });
  const [panFilter, setPanFilter] = useState<string[]>(() => {
    const panParam = searchParams.get("pans");
    return panParam ? panParam.split(",") : [];
  });
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = useMemo(
    () => ({
      pageIndex: paginationState.pageIndex,
      pageSize: paginationState.pageSize,
    }),
    [paginationState]
  );
  console.log(filteredCases, "filteredCases");
  const date = dueDateFilter ? new Date(dueDateFilter as Date) : new Date();
  const month = date.getMonth() + 1; // Months are 0-indexed
  const day = date.getDate();
  const columns: ColumnDef<ExtendedCase>[] = [
    {
      accessorKey: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            if (value) {
              console.log("value", value);
              setSelectedCases((items) => [...items, row.original.id]);
            } else {
              const cases = selectedCasesIds.filter(
                (item) => item !== row.original.id
              );
              setSelectedCases(cases);
            }
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "working_pan_color",
      header: ({ column }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              <div className="flex items-center">
                Pan
                <ChevronsUpDown className="ml-2 h-4 w-4" />
                {panFilter.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-background">
                    {panFilter.length}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
        </Popover>
      ),
      cell: ({ row }) => {
        const color = row.getValue("working_pan_color") as string | null;
        const name = row.original.working_pan_name;
        if (!color) return;
        const initials = name ? name.slice(0, 2).toUpperCase() : "";

        return (
          <div className="font-medium">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="w-8 h-6 rounded flex items-center justify-center text-xs font-medium border"
                    style={{
                      backgroundColor: color,
                      borderColor: "rgba(0,0,0,0.1)",
                      color: getContrastColor(color),
                    }}
                  >
                    {initials}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: "tag",
      header: ({ column }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              <div className="flex items-center">
                Tag
                <ChevronsUpDown className="ml-2 h-4 w-4" />
                {tagFilter.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-background">
                    {tagFilter.length}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b">
                <span className="text-sm font-medium">Filter by Pan Tag</span>
                {tagFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTagFilter([]);
                      column.setFilterValue(undefined);
                      searchParams.delete("tags");
                      setSearchParams(searchParams);
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {Array.from(
                  new Set(
                    cases
                      .filter((c) => c.tag?.name)
                      .map((c) =>
                        JSON.stringify({
                          name: c.tag?.name,
                          color: c.tag?.color,
                        })
                      )
                  )
                )
                  .map((str) => JSON.parse(str))
                  .map((tag, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.name} ${index}`}
                        checked={tagFilter.includes(tag.name)}
                        onCheckedChange={(checked) => {
                          const newTagFilter = checked
                            ? [...tagFilter, tag.name]
                            : tagFilter.filter((t) => t !== tag.name);
                          setTagFilter(newTagFilter);
                          column.setFilterValue(
                            newTagFilter.length ? newTagFilter : undefined
                          );
                          if (newTagFilter.length > 0) {
                            searchParams.set("tags", newTagFilter.join(","));
                          } else {
                            searchParams.delete("tags");
                          }
                          setSearchParams(searchParams);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{
                            backgroundColor: tag.color || "#f3f4f6",
                            borderColor: "rgba(0,0,0,0.1)",
                          }}
                        />
                        <label
                          htmlFor={`tag-${tag.name}`}
                          className="text-sm font-medium capitalize cursor-pointer"
                        >
                          {tag.name}
                        </label>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ),
      cell: ({ row }) => {
        const tag = row.getValue("tag") as { name: string; color: string };
        if (!tag?.name) return null;

        const color = tag.color || "#f3f4f6";
        const name = tag.name;
        const initials = name.slice(0, 2).toUpperCase();

        return (
          <div className="font-medium">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="w-8 h-6 rounded flex items-center justify-center text-xs font-medium border"
                    style={{
                      backgroundColor: color,
                      borderColor: "rgba(0,0,0,0.1)",
                      color: getContrastColor(color),
                    }}
                  >
                    {initials}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      filterFn: (row, id, value: string[]) => {
        if (!value?.length) return true;
        const tag = row.getValue(id) as { name: string; color: string };
        return value.includes(tag?.name || "");
      },
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
      cell: ({ row }) => <div>{row.getValue("patient_name")}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              <div className="flex items-center">
                Status
                <ChevronsUpDown className="ml-2 h-4 w-4" />
                {statusFilter.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-background">
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
                    onClick={() => {
                      setStatusFilter([]);
                      searchParams.delete("status");
                      setSearchParams(searchParams);
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {[
                "in_queue",
                "in_progress",
                "on_hold",
                "completed",
                "cancelled",
              ].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={statusFilter.includes(status as CaseStatus)}
                    onCheckedChange={(checked) => {
                      let newStatusFilter: CaseStatus[];
                      if (checked) {
                        newStatusFilter = [
                          ...statusFilter,
                          status as CaseStatus,
                        ];
                      } else {
                        newStatusFilter = statusFilter.filter(
                          (s) => s !== status
                        );
                      }
                      setStatusFilter(newStatusFilter);
                      if (newStatusFilter.length > 0) {
                        searchParams.set("status", newStatusFilter.join(","));
                      } else {
                        searchParams.delete("status");
                      }
                      setSearchParams(searchParams);
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
                          "bg-neutral-500 text-neutral-500 hover:bg-neutral-500":
                            status === "in_queue",
                          "bg-blue-500 text-blue-500 hover:bg-blue-500":
                            status === "in_progress",
                          "bg-yellow-500 text-yellow-500 hover:bg-yellow-500":
                            status === "on_hold",
                          "bg-green-500 text-green-500 hover:bg-green-500":
                            status === "completed",
                          "bg-red-500 text-red-500 hover:bg-red-500":
                            status === "cancelled",
                        }
                      )}
                    >
                      {status.replace("_", " ")}
                    </Badge>
                  </label>
                </div>
              ))}
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
                      "bg-neutral-500 text-neutral-500 hover:bg-neutral-500":
                        statusLower === "in_queue",
                      "bg-blue-500 text-blue-500 hover:bg-blue-500":
                        statusLower === "in_progress",
                      "bg-yellow-500 text-yellow-500 hover:bg-yellow-500":
                        statusLower === "on_hold",
                      "bg-green-500 text-green-500 hover:bg-green-500":
                        statusLower === "completed",
                      "bg-red-500 text-red-500 hover:bg-red-500":
                        statusLower === "cancelled",
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
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="p-0 hover:bg-transparent">
                <div className="flex items-center">
                  Due Date
                  {dueDateFilter && (
                    <Badge variant="outline" className="ml-2 bg-background">
                      {`${shortMonths[month]} ${day}`}
                    </Badge>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                <div className="flex items-center justify-between pb-2">
                  {dueDateFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDueDateFilter(undefined);
                        column.setFilterValue(undefined);
                        searchParams.delete("dueDate");
                        setSearchParams(searchParams);
                      }}
                      className="h-8 px-2 text-xs"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
                <DayPicker
                  mode="single"
                  selected={dueDateFilter}
                  onSelect={(date) => {
                    setDueDateFilter(date || undefined);
                    column.setFilterValue(date || undefined);
                    if (date) {
                      searchParams.set("dueDate", format(date, "yyyy-MM-dd"));
                    } else {
                      searchParams.delete("dueDate");
                    }
                    setSearchParams(searchParams);
                  }}
                  className="border-none"
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string;
        const parsedDate = new Date(date);

        return date ? format(parsedDate, "MMM dd, yyyy") : "TBD";
      },
      filterFn: (row, id, value: Date) => {
        if (!value) return true;
        const dueDate = row.getValue(id) as string;
        if (!dueDate) return false;
        const rowDate = new Date(dueDate);
        return (
          rowDate.getFullYear() === value.getFullYear() &&
          rowDate.getMonth() === value.getMonth() &&
          rowDate.getDate() === value.getDate()
        );
      },
    },
    {
      accessorKey: "received_date",
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
        const date = row.getValue("received_date") as string;
        return formatDate(date);
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
            <Link to={`/cases/update?caseId=${row.original.id}`}>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePrint(row.original as any)}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredCases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPaginationState,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
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
    if (dueDateFilter) {
      table.getColumn("due_date")?.setFilterValue(dueDateFilter);
    } else {
      table.getColumn("due_date")?.setFilterValue(undefined);
    }
  }, [dueDateFilter]);

  useEffect(() => {
    const getLabId = async () => {
      try {
        const data = await getLabDataByUserId(user?.id as string);
        setLab(data);
      } catch (error) {
        console.error("Error fetching lab ID:", error);
      }
    };
    getLabId();
  }, [user?.id]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          throw new Error("No active session");
        }

        // Build query with filters
        let query = supabase
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
              phone,
              street,
              city,
              state,
              zip_code
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
            tag:working_tags!working_tag_id (
                name,
                color
              ),
          working_pan_name,
          working_pan_color,
            rx_number,
            isDueDateTBD,
            appointment_date,
            case_number,
            otherItems,
            invoice_notes,
            occlusal_type,
            contact_type,
            pontic_type,
            custom_contact_details,
            custom_occulusal_details,
            custom_pontic_details,
            instruction_notes,
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
            invoice:invoices!case_id (
              id,
              case_id,
              amount,
              status,
              due_amount,
              due_date
            ),
            product_ids:case_products!id (
              products_id,
              id
            )
          `
          )
          .eq("lab_id", lab?.id)
          .order("created_at", { ascending: false });

        // Handle status filter from URL
        const statusParam = searchParams.get("status");
        if (statusParam) {
          const statuses = statusParam.split(",");
          query = query.in("status", statuses);
        }

        // Handle filter parameter from URL (for past_due, due_today, etc.)
        const filter = searchParams.get("filter");
        if (filter) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          switch (filter) {
            case "past_due":
              query = query
                .in("status", ["in_progress", "in_queue"])
                .lt("due_date", today.toISOString());
              break;
            case "due_today":
              query = query
                .in("status", ["in_progress", "in_queue"])
                .gte("due_date", today.toISOString())
                .lt("due_date", tomorrow.toISOString());
              break;
            case "due_tomorrow":
              const dayAfterTomorrow = new Date(tomorrow);
              dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
              query = query
                .in("status", ["in_progress", "in_queue"])
                .gte("due_date", tomorrow.toISOString())
                .lt("due_date", dayAfterTomorrow.toISOString());
              break;
            case "on_hold":
              query = query.eq("status", "on_hold");
              break;
          }
        } else {
          // Handle other date filters only if filter param is not present
          const dueDateParam = searchParams.get("due_date");
          if (dueDateParam) {
            const filterDate = new Date(dueDateParam);
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);

            query = query
              .gte("due_date", filterDate.toISOString())
              .lt("due_date", nextDay.toISOString());
          }

          const createdAtParam = searchParams.get("created_at");
          if (createdAtParam) {
            const filterDate = new Date(createdAtParam);
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);

            query = query
              .gte("created_at", filterDate.toISOString())
              .lt("created_at", nextDay.toISOString());
          }

          const updatedAtParam = searchParams.get("updated_at");
          if (updatedAtParam) {
            const filterDate = new Date(updatedAtParam);
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);

            query = query
              .gte("updated_at", filterDate.toISOString())
              .lt("updated_at", nextDay.toISOString());
          }
        }

        const { data: casesData, error: casesError } = await query;

        if (casesError) {
          console.error("Supabase error:", casesError);
          throw casesError;
        }

        if (!casesData) {
          setCases([]);
          setFilteredCases([]);
          return;
        }
        const transformedCases = await Promise.all(
          casesData.map(async (item) => {
            // Handle client data
            const clientData = Array.isArray(item.client)
              ? item.client[0]
              : item.client;

            // Handle doctor data
            const doctorData = Array.isArray(item.doctor)
              ? item.doctor[0]
              : item.doctor;
            const doctorClient =
              doctorData?.client && Array.isArray(doctorData.client)
                ? doctorData.client[0]
                : doctorData?.client;

            // Handle tag data
            const tagData = Array.isArray(item.tag) ? item.tag[0] : item.tag;

            // Handle enclosed items
            const enclosedItemsData = Array.isArray(item.enclosed_items)
              ? item.enclosed_items[0]
              : item.enclosed_items;

            // Prepare product IDs and case product IDs
            const productsIdArray =
              item?.product_ids?.map((p) => p.products_id) || [];
            const caseProductIds = item?.product_ids?.map((p) => p.id) || [];

            if (productsIdArray.length === 0) {
              return {
                ...item,
                client: clientData
                  ? {
                      id: clientData.id,
                      client_name: clientData.client_name,
                      phone: clientData.phone,
                    }
                  : null,
                doctor: doctorData
                  ? {
                      id: doctorData.id,
                      name: doctorData.name,
                      client: clientData
                        ? {
                            id: clientData.id,
                            client_name: clientData.client_name,
                            phone: clientData.phone,
                          }
                        : null,
                    }
                  : null,
                tags: tagData,
                enclosed_items: enclosedItemsData,
                pan_tag: item.working_pan_name || null,
                pan_color: item.working_pan_color || null,
                products: [], // No products for this case
              };
            }

            // Fetch products for the current case
            const { data: productData, error: productsError } = await supabase
              .from("products")
              .select(
                `
                  id,
                  name,
                  price,
                  lead_time,
                  is_client_visible,
                  is_taxable,
                  created_at,
                  updated_at,
                  requires_shade,
                  material:materials!material_id (
                    name,
                    description,
                    is_active
                  ),
                  product_type:product_types!product_type_id (
                    name,
                    description,
                    is_active
                  ),
                  billing_type:billing_types!billing_type_id (
                    name,
                    label,
                    description,
                    is_active
                  )
                `
              )
              .eq("lab_id", lab?.id)
              .in("id", productsIdArray);

            if (productsError) {
              console.error("Error fetching products for case:", productsError);
              return { ...item, products: [] }; // Return empty products if there's an error
            }

            const { data: discountedPriceData, error: discountedPriceError } =
              await supabase
                .from("discounted_price")
                .select(
                  `
                  id,
                  product_id,
                  discount,
                  final_price,
                  price,
                  quantity
                `
                )
                .in("product_id", productsIdArray)
                .eq("case_id", item.id);

            if (discountedPriceError) {
              console.error(
                "Error fetching discounted prices for case:",
                discountedPriceError
              );
            }

            const { data: teethProductData, error: teethProductsError } =
              await supabase
                .from("case_product_teeth")
                .select(
                  `
                  id,
                  is_range,
                  tooth_number,
                  product_id,
                  occlusal_shade:shade_options!occlusal_shade_id (
                    name,
                    category,
                    is_active
                  ),
                  body_shade:shade_options!body_shade_id (
                    name,
                    category,
                    is_active
                  ),
                  gingival_shade:shade_options!gingival_shade_id (
                    name,
                    category,
                    is_active
                  ),
                  stump_shade:shade_options!stump_shade_id (
                    name,
                    category,
                    is_active
                  )
                `
                )
                .in("product_id", productsIdArray)
                .eq("case_product_id", item?.product_ids[0]?.id);

            if (teethProductsError) {
              console.error(
                "Error fetching teeth products:",
                teethProductsError
              );
            }

            // Combine products with their relevant discounts and teeth products
            const productsWithDiscounts = productData.flatMap((product) => {
              const relevantDiscounts =
                discountedPriceData?.filter(
                  (discount) => discount.product_id === product.id
                ) || [];

              const relevantTeethProducts =
                teethProductData?.filter(
                  (teeth) => teeth.product_id === product.id
                ) || [];

              return relevantTeethProducts
                .map((teeth, index) => {
                  const discountedPrice = relevantDiscounts[index] || null;

                  return {
                    ...product,
                    discounted_price: { ...discountedPrice },
                    teethProduct: { ...teeth },
                  };
                })
                .filter((item) => item.teethProduct.tooth_number !== null);
            });

            return {
              ...item,
              products: productsWithDiscounts,
              labDetail: lab,
            };
          })
        );

        setCases(transformedCases as any);
        setFilteredCases(transformedCases as any);
      } catch (err) {
        console.error("Error details:", err);
        logger.error("Error fetching cases:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch cases");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && lab?.id) {
      fetchCases();
    }
  }, [user, authLoading, lab, searchParams]);

  useEffect(() => {
    const filter = searchParams.get("filter");

    if (filter) {
      // Get today's date in UTC at midnight
      const today = new Date();
      const todayUTC = Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
      );

      // Calculate tomorrow's date in UTC
      const tomorrowUTC = todayUTC + 24 * 60 * 60 * 1000; // Add one day in milliseconds

      const filteredCases = cases.filter((caseItem) => {
        const dueDate = new Date(caseItem.due_date);

        const dueDateUTC = Date.UTC(
          dueDate.getUTCFullYear(),
          dueDate.getUTCMonth(),
          dueDate.getUTCDate()
        );

        switch (filter) {
          case "past_due":
            return dueDateUTC < todayUTC && caseItem.status !== "completed";
          case "due_today":
            return dueDateUTC === todayUTC && caseItem.status !== "completed";
          case "due_tomorrow":
            return (
              dueDateUTC === tomorrowUTC && caseItem.status !== "completed"
            );
          case "on_hold":
            return caseItem.status === "on_hold";
          default:
            return true;
        }
      });

      setFilteredCases(filteredCases);
    } else {
      setFilteredCases(cases);
    }
  }, [searchParams, cases]);

  const handlePrint = (selectedRows: Row<ExtendedCase>[]) => {
    console.log("Printing selected rows:", selectedRows);
  };

  const handlePrintOptionSelect = (option: string) => {
    const selectedCases = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (selectedCases.length === 0) return;

    // Create the preview URL with state encoded in base64
    const previewState = {
      type: option,
      paperSize: "LETTER", // Default to letter size
      caseData: selectedCases.map((caseItem) => ({
        id: caseItem.id,
        patient_name: caseItem.patient_name,
        case_number: caseItem.case_number,
        qr_code: `https://app.labulous.com/cases/${caseItem.id}`,
        client: caseItem.client,
        doctor: caseItem.doctor,
        created_at: caseItem.created_at,
        due_date: caseItem.due_date,
        tag: caseItem.tag,
      })),
      caseDetails: cases.filter((item) => selectedCasesIds.includes(item.id)),
    };

    const stateParam = encodeURIComponent(btoa(JSON.stringify(previewState)));
    const previewUrl = `${window.location.origin}/print-preview?state=${stateParam}`;
    window.open(previewUrl, "_blank");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  console.log(selectedCasesIds, "Selected");
  console.log(
    cases.filter((item) => selectedCasesIds.includes(item.id)),
    "Selected"
  );
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
          <div className="flex gap-2">
            {table.getSelectedRowModel().rows.length > 0 ? (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  {table.getSelectedRowModel().rows.length}{" "}
                  {table.getSelectedRowModel().rows.length === 1
                    ? "case"
                    : "cases"}{" "}
                  selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handlePrintOptionSelect("lab-slip")}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Lab Slip
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handlePrintOptionSelect("address-label")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Address Label
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handlePrintOptionSelect("qr-code")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      QR Code Label
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handlePrintOptionSelect("patient-label")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Patient Label
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filter cases..."
              value={
                (table.getColumn("case_number")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("case_number")
                  ?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup, index) => (
                <TableRow key={index}>
                  {headerGroup.headers.map((header, index) => (
                    <TableHead
                      key={index}
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

function getContrastColor(hexcolor: string): string {
  // Default to black text for empty or invalid colors
  if (!hexcolor || hexcolor === "transparent") return "#000000";

  // Convert hex to RGB
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white depending on background color luminance
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export default CaseList;
