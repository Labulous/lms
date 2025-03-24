import { useState, useEffect, useMemo, useRef } from "react";
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
  CalendarIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageHeader } from "@/components/ui/page-header";
import { shortMonths } from "@/lib/months";
import { ExtendedCase } from "./CaseDetails";
import { formatDateWithTime, formatDate } from "@/lib/formatedDate";
import toast from "react-hot-toast";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useLocation } from "react-router-dom";
import { calculateDueDate } from "@/lib/calculateDueDate";
import InvoicePreviewModal from "../invoices/InvoicePreviewModal";
import { HoverCard } from "../ui/hover-card";
import { HoverCardTrigger } from "@radix-ui/react-hover-card";

const logger = createLogger({ module: "CaseList" });

const CaseList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<ExtendedCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ExtendedCase | null>(null);
  const [filteredCases, setFilteredCases] = useState<ExtendedCase[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  // const [selectedRows, setSelectedRows] = useState<Row<ExtendedCase>[]>([]);
  // const [lab, setLab] = useState<labDetail | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedCasesIds, setSelectedCases] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<CaseStatus[]>(() => {
    const statusParam = searchParams.get("status");
    return statusParam ? (statusParam.split(",") as CaseStatus[]) : [];
  });
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined | string>(
    () => {
      const dueDateParam = searchParams.get("dueDate");

      // Parse the date as UTC and return it, or undefined if no date is provided
      return dueDateParam ? new Date() : undefined;
    }
  );

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

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
  const [pageSize, setPageSize] = useState<number>(15);
  const [selectedOrderCases, setSelectedOrderCases] = useState<ExtendedCase[]>(
    []
  );

  const pagination = useMemo(
    () => ({
      pageIndex: paginationState.pageIndex,
      pageSize: pageSize,
    }),
    [paginationState, pageSize]
  );
  let date;
  const location = useLocation();
  const previousPath = location?.state?.from || "No previous path available";
  if (typeof dueDateFilter === "string") {
    const [year, month, day] = dueDateFilter.split("-").map(Number);
    date = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)); // Always 12 AM UTC
  } else {
    date = new Date();
  }

  console.log(
    dueDateFilter,
    date,
    searchParams.get("dueDate"),
    "dueDateFilter"
  );

  const month = date.getMonth() + 1; // Months are 0-indexed
  const day = searchParams.get("dueDate")
    ? searchParams.get("dueDate")?.split("-")[2]
    : null;
  const columns: ColumnDef<ExtendedCase>[] = [
    // {
    //   accessorKey: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => {
    //         row.toggleSelected(!!value);
    //         if (value) {
    //           setSelectedCases((items) => [...items, row.original.id]);
    //         } else {
    //           const cases = selectedCasesIds.filter(
    //             (item) => item !== row.original.id
    //           );
    //           setSelectedCases(cases);
    //         }
    //       }}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);

            if (value) {
              // Select all visible row IDs
              const allRowIds = table
                .getRowModel()
                .rows.map((row) => row.original.id);
              setSelectedCases(allRowIds);
            } else {
              // Clear selection
              setSelectedCases([]);
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            setSelectedCases((prev) =>
              value
                ? [...prev, row.original.id]
                : prev.filter((id) => id !== row.original.id)
            );
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
        if (!name && !color) {
          return;
        }

        return (
          <div className="font-medium">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2 justify-end w-full">
                    <div
                      className="w-4 h-4 rounded-sm border relative"
                      style={{
                        backgroundColor: color || "white",
                        borderColor: "rgba(0,0,0,0.4)",
                      }}
                    >
                      {!color && (
                        <div
                          className="absolute inset-0"
                          style={{
                            content: '""',
                            background: `linear-gradient(to top right, transparent calc(50% - 2px), rgba(0,0,0,0.4), transparent calc(50% + 2px))`,
                          }}
                        />
                      )}
                    </div>
                    <span className="text-sm">{name}</span>
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
          Inv #
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      // cell: ({ row }) => (
      //   <Link
      //     to={`/cases/${row.original.id}`}
      //     className="font-medium text-primary hover:underline"
      //   >
      //     {row.getValue("case_number")}
      //   </Link>
      // ),
      cell: ({ row }) => (
        <HoverCard
          onOpenChange={(open) => {
            if (open) {
              setSelectedCase(row.original);
              setIsPreviewModalOpen(true);
            }
          }}
        >
          <HoverCardTrigger asChild>
            <Link
              to={`/cases/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              {row.getValue("case_number")}
            </Link>
          </HoverCardTrigger>
        </HoverCard>
      ),
    },
    {
      accessorKey: "patient_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation(); 
            column.toggleSorting(undefined, true); 
          }}
          className="p-0 hover:bg-transparent"
        >
          Patient Name
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const patientName = row.original.patient_name as string | null;
        return <div>{patientName || "N/A"}</div>;
      },
      sortingFn: (rowA, rowB) => {
        const patientA = (rowA.original.patient_name || "").toLowerCase();
        const patientB = (rowB.original.patient_name || "").toLowerCase();
        return patientA.localeCompare(patientB);
      },
      enableSorting: true, 
      enableMultiSort: true,
      sortDescFirst: false, 
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
                "shipped",
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
                          "bg-purple-500 text-purple-500 hover:bg-purple-500":
                            status === "shipped",
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
          onClick={(e) => {
            e.stopPropagation(); 
            column.toggleSorting(undefined, true); 
          }}
          className="p-0 hover:bg-transparent"
        >
          Client
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const client = row.getValue("client") as { client_name?: string } | null;
        return <div>{client?.client_name || "N/A"}</div>;
      },
      sortingFn: (rowA, rowB) => {
        const clientA =
          (rowA.getValue("client") as { client_name?: string })?.client_name?.toLowerCase() || "";
        const clientB =
          (rowB.getValue("client") as { client_name?: string })?.client_name?.toLowerCase() || "";
        return clientA.localeCompare(clientB);
      },
      enableSorting: true, 
      enableMultiSort: true, 
      sortDescFirst: false, 
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
                      {`${shortMonths[month - 1]} ${day}`}
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
                  selected={dueDateFilter as Date}
                  onSelect={(date) => {
                    setDueDateFilter(date || undefined);
                    column.setFilterValue(date || undefined);
                    if (date) {
                      console.log(date, "datedatedate");

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
        const dueDate = row.getValue("due_date") as string;
        const parsedDate = new Date(dueDate);
        return date ? format(parsedDate, "MMM dd, yyyy") : "TBD";

        // const dueDate = row.getValue("due_date") as string;
        // const client = row.getValue("client") as { client_name: string; additional_lead_time?: string } | null;
        // const parsedDate = calculateDueDate(dueDate, client ?? undefined);
        // return parsedDate;
      },
      filterFn: (row, id, value: Date) => {
        if (!value) return true;
        let dueDate = row.getValue(id) as string;

        if (!dueDate) return false;
        let rowDate = new Date(dueDate);
        // value.setUTCDate(value.getUTCDate() + 1);
        const filterDate = searchParams.get("dueDate");
        const formatedDate = filterDate ? new Date(filterDate) : null;
        const utcDate = formatedDate
          ? formatedDate.setUTCDate(formatedDate.getUTCDate() + 1)
          : null;

        return (
          rowDate.getFullYear() === value.getFullYear() &&
          rowDate.getMonth() === value.getMonth() &&
          dueDate?.split("T")?.[0].split("-")?.[2] ===
          formatedDate?.toDateString().split(" ")?.[2]
        );
      },
    },
    // {
    //   accessorKey: "received_date",
    //   header: ({ column }) => (
    //     <Button
    //       variant="ghost"
    //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //       className="p-0 hover:bg-transparent"
    //     >
    //       Ordered Date
    //       <ChevronsUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     const date = row.getValue("received_date") as string;
    //     const createdAt = row.original.created_at;

    //     return formatDate(date || createdAt);
    //   },
    // },
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
        const createdAt = row.original.created_at;

        return formatDate(date || createdAt);
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue("received_date") || rowA.original.created_at).getTime();
        const dateB = new Date(rowB.getValue("received_date") || rowB.original.created_at).getTime();

        return dateA - dateB;
      },
      sortDescFirst: false,
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
            {/* <DropdownMenuItem onClick={() => handlePrint(row.original as any)}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem> */}

            <DropdownMenuItem
              onClick={() => {
                handlePrintOptionSelect("lab-slip", [row.original.id]);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Lab Slip
            </DropdownMenuItem>

            {/* <DropdownMenuItem
              onClick={() => {
                handlePrintOptionSelect("lab-slip", [row.original.id]);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Lab Slip
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={() =>
                handlePrintOptionSelect("address-label", [row.original.id])
              }
            >
              <FileText className="h-4 w-4 mr-2" />
              Address Label
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handlePrintOptionSelect("qr-code", [row.original.id])
              }
            >
              <FileText className="h-4 w-4 mr-2" />
              QR Code Label
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handlePrintOptionSelect("patient-label", [row.original.id])
              }
            >
              <FileText className="h-4 w-4 mr-2" />
              Patient Label
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    supabase.from("users").select("lab_id").eq("id", user?.id).single(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (labError) {
    return <div>Loading!!!</div>;
  }

  const { data: query, error: caseError } = useQuery(
    labIdData?.lab_id
      ? supabase
        .from("cases")
        .select(
          `
       id,
        created_at,
        received_date,
        common_services,
        ship_date,
        status,
        patient_name,
        due_date,
        attachements,
        case_number,
        isDisplayAcctOnly,
        isDisplayDoctorAcctOnly,
        isHidePatientName,
        invoice:invoices!case_id (
          id,
          case_id,
          amount,
          status,
          due_amount,
          due_date
        ),
        client:clients!client_id (
          id,
          client_name,
          phone,
          street,
          city,
          state,
          zip_code,
          additional_lead_time,
          account_number
        ),
        doctor:doctors!doctor_id (
          id,
          name,
          order,
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
        received_date,
        invoice_notes,
        isDueDateTBD,
        isDisplayAcctOnly,
        isDisplayDoctorAcctOnly,
        isHidePatientName,
        appointment_date,
        instruction_notes,
        otherItems,
        occlusal_type,
        contact_type,
        pontic_type,
        qr_code,
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
        created_by:users!created_by (
          name,
          id
        ),
        product_ids:case_products!id (
          products_id,
          id
        ),
         margin_design_type,
        occlusion_design_type,
        alloy_type,
        custom_margin_design_type,
        custom_occlusion_design_type,
        custon_alloy_type,
      discounted_price:discounted_price!id (
                id,
                product_id,
                discount,
                final_price,
                price,
                quantity,
                total
          ),
        teethProduct: case_product_teeth!id (
          id,
          is_range,
          additional_services_id,
          type,
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
                    ),
                  pontic_teeth,
                  notes,
                  product_id,
                  custom_body_shade,
                  custom_occlusal_shade,
                  custom_gingival_shade,
                  custom_stump_shade,
                  type,
          product:products!product_id (
                    id,
                    name,
                    price,
                    lead_time,
                    is_client_visible,
                    is_taxable,
                    created_at,
                    updated_at,
                    requires_shade,
                    product_code,
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
          )
          )
    `
        )
        .eq("lab_id", labIdData?.lab_id)
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
        .order("created_at", { ascending: false })
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  if (caseError && labIdData?.lab_id) {
    // toast.error("failed to fetech cases");
  }

  const arragedNewCases: ExtendedCase[] | undefined = query?.map(
    (item: any) => {
      return {
        ...item,
        products: item.teethProduct.map((tp: any, index: number) => ({
          id: tp.product.id,
          name: tp.product.name,
          price: tp.product.price,
          lead_time: tp.product.lead_time,
          is_client_visible: tp.product.is_client_visible,
          is_taxable: tp.product.is_taxable,
          created_at: tp.product.created_at,
          updated_at: tp.product.updated_at,
          requires_shade: tp.product.requires_shade,
          material: tp.product.material,
          product_type: tp.product.product_type,
          product_code: tp.product.product_code,
          billing_type: tp.product.billing_type,
          discounted_price: tp.product.discounted_price,
          additional_services_id:
            item?.teethProduct?.[index].additional_services_id,
          teethProduct: {
            id: tp.id,
            is_range: tp.is_range,
            tooth_number: tp.tooth_number,
            product_id: tp.product_id,
            occlusal_shade: tp.occlusal_shade,
            body_shade: tp.body_shade,
            pontic_teeth: tp.pontic_teeth,
            gingival_shade: tp.gingival_shade,
            stump_shade: tp.stump_shade,
            manual_occlusal_shade: tp.manual_occlusal_shade,
            manual_body_shade: tp.manual_body_shade,
            manual_gingival_shade: tp.manual_gingival_shade,
            manual_stump_shade: tp.manual_stump_shade,
            custom_occlusal_shade: tp.custom_occlusal_shade,
            custom_body_shade: tp.custom_body_shade,
            custom_gingival_shade: tp.custom_gingival_shade,
            custom_stump_shade: tp.custom_stump_shade,
            custom_occlusal_details: tp.occlusal_shade,
            notes: tp.notes,
            type: tp.type,
          },
        })),
      };
    }
  );
  console.log(arragedNewCases, "arragedNewCases")

  const handleFetchData = async () => {
    try {
      const { data: query, error } = await supabase
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
        attachements,
        case_number,
        isDisplayAcctOnly,
        isDisplayDoctorAcctOnly,
        isHidePatientName,
        invoice:invoices!case_id (
          id,
          case_id,
          amount,
          status,
          due_amount,
          due_date
        ),
        client:clients!client_id (
          id,
          client_name,
          phone,
          street,
          city,
          state,
          zip_code,
          account_number
        ),
        doctor:doctors!doctor_id (
          id,
          name,
          order,
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
        received_date,
        invoice_notes,
        isDueDateTBD,
        isDisplayAcctOnly,
        isDisplayDoctorAcctOnly,
        isHidePatientName,
        appointment_date,
        instruction_notes,
        otherItems,
        occlusal_type,
        contact_type,
        pontic_type,
        qr_code,
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
        created_by:users!created_by (
          name,
          id
        ),
        product_ids:case_products!id (
          products_id,
          id
        ),
         margin_design_type,
        occlusion_design_type,
        alloy_type,
        custom_margin_design_type,
        custom_occlusion_design_type,
        custon_alloy_type,
      discounted_price:discounted_price!id (
                id,
                product_id,
                discount,
                final_price,
                price,
                quantity,
                total
          ),
        teethProduct: case_product_teeth!id (
          id,
          is_range,
          type,
          tooth_number,
          pontic_teeth,
          product_id,
          additional_services_id,
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
                    ),
                  pontic_teeth,
                  notes,
                  product_id,
                  custom_body_shade,
                  custom_occlusal_shade,
                  custom_gingival_shade,
                  custom_stump_shade,
                  type,
          product:products!product_id (
                    id,
                    name,
                    price,
                    lead_time,
                    is_client_visible,
                    is_taxable,
                    created_at,
                    updated_at,
                    requires_shade,
                    product_code,
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
          )
          )
          `
        )
        .eq("lab_id", labIdData?.lab_id)
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
        .order("created_at", { ascending: false });

      if (error) {
        console.log("failed to fetch cases");
      }
      const arragedNewCases: ExtendedCase[] =
        query?.map((item: any, index: number) => {
          return {
            ...item,
            products: item.teethProduct.map((tp: any) => ({
              id: tp.product.id,
              name: tp.product.name,
              price: tp.product.price,
              lead_time: tp.product.lead_time,
              is_client_visible: tp.product.is_client_visible,
              is_taxable: tp.product.is_taxable,
              created_at: tp.product.created_at,
              updated_at: tp.product.updated_at,
              requires_shade: tp.product.requires_shade,
              material: tp.product.material,
              product_type: tp.product.product_type,
              product_code: tp.product.product_code,
              billing_type: tp.product.billing_type,
              discounted_price: tp.product.discounted_price,
              additional_services_id:
                item?.teethProduct?.[index].additional_services_id,
              teethProduct: {
                id: tp.id,
                is_range: tp.is_range,
                tooth_number: tp.tooth_number,
                pontic_teeth: tp.pontic_teeth,
                product_id: tp.product_id,
                occlusal_shade: tp.occlusal_shade,
                body_shade: tp.body_shade,
                gingival_shade: tp.gingival_shade,
                stump_shade: tp.stump_shade,
                manual_occlusal_shade: tp.manual_occlusal_shade,
                manual_body_shade: tp.manual_body_shade,
                type: tp.type,
                manual_gingival_shade: tp.manual_gingival_shade,
                manual_stump_shade: tp.manual_stump_shade,
                custom_occlusal_shade: tp.custom_occlusal_shade,
                custom_body_shade: tp.custom_body_shade,
                custom_gingival_shade: tp.custom_gingival_shade,
                custom_stump_shade: tp.custom_stump_shade,
                custom_occlusal_details: tp.occlusal_shade,
                notes: tp.notes,
              },
            })),
          };
        }) || [];
      if (arragedNewCases) {
        setCases(arragedNewCases);
      }
    } catch (err) {
      console.log("err");
    }
  };
  const table = useReactTable({
    data: filteredCases as ExtendedCase[],
    columns,
    pageCount: Math.ceil(filteredCases.length / pageSize),
    state: {
      rowSelection,
      pagination: { pageIndex: paginationState.pageIndex, pageSize },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (previousPath === "cases") {
      handleFetchData();
    }
  }, [previousPath]);
  useEffect(() => {
    if (statusFilter.length > 0) {
      table.getColumn("status")?.setFilterValue(statusFilter);
    } else {
      table.getColumn("status")?.setFilterValue(undefined);
    }
    if (dueDateFilter) {
      console.log(dueDateFilter, "dueDateFilter");
      table.getColumn("due_date")?.setFilterValue(dueDateFilter);
    } else {
      table.getColumn("due_date")?.setFilterValue(undefined);
    }
  }, [statusFilter, dueDateFilter]);

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (arragedNewCases && arragedNewCases.length > 0 && !hasRunRef.current) {
      setCases(arragedNewCases);
      hasRunRef.current = true; // Mark that the effect has run
    }
  }, [arragedNewCases]);
  useEffect(() => {
    const filter = searchParams.get("filter");
    console.log(filter, "filter");

    if (filter) {
      // Get today's date in UTC at midnight
      const today = new Date();
      const todayUTC = new Date();

      // Calculate tomorrow's date in UTC
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(today.getUTCDate() + 1);
      const filteredCases = cases.filter((caseItem) => {
        const dueDate = new Date(caseItem.due_date);

        const isDueTomorrow = (dueDate: string) => {
          const due = new Date(dueDate);
          return (
            due.getDate() === tomorrow.getDate() &&
            due.getMonth() === tomorrow.getMonth() &&
            due.getFullYear() === tomorrow.getFullYear()
          );
        };
        // Set the start and end of today to compare full date range
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0); // Set hours to 12:00 AM (UTC)

        // End of today in UTC (11:59:59.999 PM UTC)
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999); //

        const isDueToday = (dueDate: string) => {
          const due = new Date(dueDate);
          return due >= startOfToday && due <= endOfToday;
        };
        switch (filter) {
          case "past_due":
            return (
              new Date(caseItem.due_date) < startOfToday &&
              caseItem.status !== "completed" &&
              caseItem.status !== "on_hold" &&
              caseItem.status !== "cancelled"
            );
          case "due_today":
            return (
              isDueToday(caseItem.due_date) && caseItem.status !== "completed"
            );
          case "due_tomorrow":
            return (
              isDueTomorrow(caseItem.due_date) &&
              caseItem.status !== "completed"
            );
          case "on_hold":
            return caseItem.status === "on_hold";
          default:
            return true;
        }
      });

      setFilteredCases(filteredCases);
    } else {
      const setData = async () => {
        (await arragedNewCases)
          ? setFilteredCases(cases)
          : setFilteredCases([]);
      };
      setData();
    }
  }, [searchParams, cases]);

  const handlePrint = (selectedRows: Row<ExtendedCase>[]) => {
    console.log("Printing selected rows:", selectedRows);
  };

  const handlePrintOptionSelect = (option: string, selectedId?: string[]) => {
    const selectedCases = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (selectedCases.length === 0 && !selectedId) return;
    console.log(selectedCases, "selectedCases");
    const previewState = {
      type: option,
      paperSize: "LETTER", // Default paper size
      // caseData:
      //   selectedCases.length > 0
      //     ? selectedCases.map((caseItem) => ({
      //         id: caseItem.id,
      //         patient_name: caseItem.patient_name,
      //         case_number: caseItem.case_number,
      //         qr_code: `https://app.labulous.com/cases/${caseItem.id}`,
      //         client: caseItem.client,
      //         doctor: caseItem.doctor,
      //         created_at: caseItem.created_at,
      //         //due_date: caseItem.due_date,
      //         due_date: calculateDueDate(
      //           caseItem.due_date,
      //           caseItem.client ?? undefined
      //         ),
      //         tag: caseItem.tag,
      //       }))
      //     : cases
      //         .filter((item) =>
      //           selectedId && selectedId.length > 0
      //             ? selectedId.includes(item.id)
      //             : selectedCasesIds.includes(item.id)
      //         )
      //         .map((caseItem) => ({
      //           id: caseItem.id,
      //           patient_name: caseItem.patient_name,
      //           case_number: caseItem.case_number,
      //           qr_code: `https://app.labulous.com/cases/${caseItem.id}`,
      //           client: caseItem.client,
      //           doctor: caseItem.doctor,
      //           created_at: caseItem.created_at,
      //           //due_date: caseItem.due_date,
      //           due_date: calculateDueDate(
      //             caseItem.due_date,
      //             caseItem.client ?? undefined
      //           ),
      //           tag: caseItem.tag,
      //         })),
      caseData: {},
      caseDetails: cases.filter((item) =>
        selectedId && selectedId.length > 0
          ? selectedId.includes(item.id)
          : selectedCasesIds.includes(item.id)
      ),
    };
    console.log(
      cases.filter((item) =>
        selectedId && selectedId.length > 0
          ? selectedId.includes(item.id)
          : selectedCasesIds.includes(item.id)
      ),
      "hi"
    );
    // Use a fixed storage key so that the data always overrides the previous entry.
    const storageKey = "printData";
    localStorage.setItem(storageKey, JSON.stringify(previewState));
    // Store data in localStorage

    // Open the print preview page
    window.open(`${window.location.origin}/print-preview`, "_blank");
  };




  const handlePrintSelectedOrder = () => {
    debugger
    const selectedCases = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (selectedCases.length === 0) {
      alert("Please select at least one case to print.");
      return;
    }


    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Selected Orders</title>
        <style>
           @media screen {
            body { display: none; } /* Hide content in normal view */
          }
          @media print {
            @page {
              size: Letter;  /* Set page size to Letter (8.5" x 11") */
              margin: 0.5in; /* Set 0.5-inch margins for better printing */
            }
            body {
              display: block;
              background: white !important;
              font-family: Arial, sans-serif;
              font-size: 8pt; /* Readable text size */
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h2 { text-align: center; margin-bottom: 10px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .color-box {
              width: 12px;
              height: 12px;
              display: inline-block;
              border: 1px solid #000;
              margin-right: 5px;
              vertical-align: middle;
            }
          }
        </style>
      </head>
      <body>       
        <table>
          <thead>
            <tr>
              <th>Inv #</th>
              <th>Clinic</th>
              <th>Patient</th>
              <th>Pan #</th>
              <th>Due Date</th>             
              <th>Appt. Date</th>
              <th>Status</th>
              <th>Product</th>
              <th>Tooth #</th>
              <th style="width: 50px;"></th>
            </tr>
          </thead>
          <tbody>
            ${selectedCases
        .map(
          (caseItem) => `          
                <tr>
                 <td>${caseItem.case_number}</td>
                 <td>${caseItem.client.client_name}</td>
                  <td>${caseItem.patient_name}</td>
                  <td>
                    <span class="color-box" style="background-color: ${caseItem.working_pan_color || "white"
            };"></span>
                    ${caseItem.working_pan_name || ""}
                  </td>                  
                 <td>${new Date(caseItem.due_date).toLocaleDateString()}</td>
                  <td>${new Date(caseItem.appointment_date).toLocaleDateString()}</td>
                  <td>${caseItem.status}</td>
                  <td>
                    ${[...new Set(caseItem.products?.map(product => product.name).filter(Boolean))].join(", ") || ""}
                  </td>
                  <td>
  ${(() => {
              const toothNumbers = caseItem.teethProduct
                ?.flatMap(tp => tp.tooth_number || [])
                .filter(Boolean)
                .join(", ");

              const ponticTeeth = caseItem.teethProduct
                ?.flatMap(tp => tp.pontic_teeth || [])
                .filter(Boolean)
                .join(", ");

              return [toothNumbers, ponticTeeth].filter(Boolean).join(" | ");
            })()}
</td>

                  <td></td>
                </tr>
              `
        )
        .join("")}
          </tbody>
        </table>
  
        <script>
          setTimeout(() => {
            window.print();
            window.onafterprint = () => {
              window.close();
            };
          }, 500);
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handlePrintInvoice = () => {
    debugger
    const selectedCases = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (selectedCases.length === 0) {
      alert("Please select at least one case to print.");
      return;
    }
    setIsPreviewModalOpen(true);

  };

  // const handlePrintSelectedOrder = () => {
  //   const selectedCases = table.getSelectedRowModel().rows.map((row) => row.original);

  //   if (selectedCases.length === 0) {
  //     alert("Please select at least one case to print.");
  //     return;
  //   }

  //   const printWindow = window.open("", "_blank");
  //   if (!printWindow) return;

  //   printWindow.document.open();
  //   printWindow.document.write(`
  //     <!DOCTYPE html>
  //     <html lang="en">
  //     <head>
  //       <meta charset="UTF-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title style="font-size:20px">Selected Orders</title>
  //       <style>
  //         @media screen {
  //           body { display: none; } /* Hide content in normal view */
  //         }
  //         @media print {
  //           @page {
  //             size: Letter;  /* Set page size to Letter (8.5" x 11") */
  //             margin: 0.5in; /* Set 0.5-inch margins for better printing */
  //           }
  //           body {
  //             display: block;
  //             background: white !important;
  //             font-family: Arial, sans-serif;
  //             font-size: 12pt; /* Readable text size */
  //             -webkit-print-color-adjust: exact;
  //             print-color-adjust: exact;
  //           }
  //           h2 { text-align: center; margin-bottom: 10px; }
  //           table {
  //             width: 100%;
  //             border-collapse: collapse;
  //             margin-top: 10px;
  //           }
  //           th, td {
  //             border: 1px solid black;
  //             padding: 8px;
  //             text-align: left;
  //           }
  //           th {
  //             background-color: #f2f2f2;
  //           }
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th>Pan</th>
  //             <th>Tag</th>
  //             <th>Case #</th>
  //             <th>Patient Name</th>
  //             <th>Status</th>
  //             <th>Doctor</th>
  //             <th>Client</th>
  //             <th>Due Date</th>
  //             <th>Ordered Date</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${selectedCases
  //       .map(
  //         (caseItem) => `
  //               <tr>
  //                 <td>${caseItem.working_pan_name}</td>
  //                 <td>${caseItem.tag}</td>
  //                 <td>${caseItem.case_number}</td>
  //                 <td>${caseItem.patient_name}</td>
  //                 <td>${caseItem.status}</td>
  //                 <td>${caseItem.doctor.name}</td>
  //                 <td>${caseItem.client.client_name}</td>
  //                 <td>${new Date(caseItem.due_date).toLocaleDateString()}</td>
  //                 <td>${new Date(caseItem.created_at).toLocaleDateString()}</td>
  //               </tr>
  //             `
  //       )
  //       .join("")}
  //         </tbody>
  //       </table>

  //       <script>
  //         setTimeout(() => {
  //           window.print();
  //           setTimeout(() => window.close(), 500);
  //         }, 500);
  //       </script>
  //     </body>
  //     </html>
  //   `);
  //   printWindow.document.close();
  // };

  if (!arragedNewCases) {
    return <div>Loading...</div>;
  }

  if (!table) return <div>Loading...</div>;

  //   return <div>Error: {error}</div>;
  // }
  const amount = 20133;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Case Management"
        description="View and manage all your dental lab cases."
      >
        <Button onClick={() => navigate("/cases/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Case
        </Button>
      </PageHeader>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* <div className="flex gap-2">
              {table && table.getSelectedRowModel().rows.length > 0 ? (
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
                      <DropdownMenuItem
                        onClick={() => handlePrintSelectedOrder()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Selected Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : null}
            </div> */}

          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {table?.getSelectedRowModel().rows.length || 0}{" "}
              {table?.getSelectedRowModel().rows.length === 1 ? "case" : "cases"} selected
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={table?.getSelectedRowModel().rows.length === 0} // ✅ Disable when no cases are selected
                  className={table?.getSelectedRowModel().rows.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print Options
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handlePrintOptionSelect("lab-slip")}>
                  <Printer className="h-4 w-4 mr-2" />
                  Lab Slip
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintOptionSelect("address-label")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Address Label
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintOptionSelect("qr-code")}>
                  <FileText className="h-4 w-4 mr-2" />
                  QR Code Label
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintOptionSelect("patient-label")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Patient Label
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintSelectedOrder()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Selected Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintInvoice()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Invoice
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Select Due Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex items-center justify-between pb-2">
                  {dueDateFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDueDateFilter(undefined);
                        table.getColumn("due_date")?.setFilterValue(undefined);
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
                  selected={dueDateFilter as Date}
                  onSelect={(date) => {
                    setDueDateFilter(date || undefined);
                    if (date) {
                      table.getColumn("due_date")?.setFilterValue(date);
                      searchParams.set("dueDate", format(date, "yyyy-MM-dd"));
                    } else {
                      table.getColumn("due_date")?.setFilterValue(undefined);
                      searchParams.delete("dueDate");
                    }
                    setSearchParams(searchParams);
                  }}
                  className="border-none"
                />
              </PopoverContent>
            </Popover>

            <Input
              placeholder="Filter cases..."
              value={(table.getColumn("case_number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("case_number")?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
          </div>

        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table && table.getHeaderGroups().map((headerGroup, index) => (
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
              {table && table.getRowModel().rows?.length ? (
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
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-4">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[15, 50, 100, 150].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 text-sm text-muted-foreground">
              {table && table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table && table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
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

      {/* Invoice Preview Modal */}
      {isPreviewModalOpen && (
        <InvoicePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setIsLoadingPreview(false);
          }}
          // formData={{
          //   clientId: selectedCase?.client?.id || "",
          //   items: selectedCase?.invoice?.[0]?.items || [],
          //   discount: selectedCase?.invoice?.[0]?.discount || 0,
          //   discountType: selectedCase?.invoice?.[0]?.discount_type || "percentage",
          //   tax: selectedCase?.invoice?.[0]?.tax || 0,
          //   notes: selectedCase?.invoice?.[0]?.notes || "",
          // }}
          caseDetails={
            selectedCasesIds.length > 0
              ? cases.filter((item) => selectedCasesIds.includes(item.id))
              : [
                selectedCase
                  ? { ...selectedCase, labDetail: selectedCase?.labDetail as labDetail }
                  : { ...cases[0], labDetail: cases[0]?.labDetail as labDetail },
              ]
          }
        />
      )}
    </div>
  );

  function getContrastColor(hexcolor: string): string {
    // Default to black text for empty or invalid colors
    if (!hexcolor || hexcolor === "transparent") return "red";

    // Convert hex to RGB
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white depending on background color luminance
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }
};



// export function calculateDueDate(
//   dueDate?: string,
//   client?: { client_name: string; additional_lead_time?: string }
// ): string {
//   if (!dueDate) return "TBD";
//   const parsedDate = new Date(dueDate);
//   if (isNaN(parsedDate.getTime())) return "Invalid Date";
//   const additionalLeadTime = client?.additional_lead_time ? Number(client.additional_lead_time) : 0;

//   if (!isNaN(additionalLeadTime) && additionalLeadTime > 0) {
//     parsedDate.setDate(parsedDate.getDate() + additionalLeadTime);
//   }

//   return format(parsedDate, "MMM dd, yyyy");
// }

export default CaseList;
