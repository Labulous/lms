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

const logger = createLogger({ module: "CaseList" });

const SelectedOrderCases: React.FC = () => {
    const location = useLocation();
    const tableRef = useRef<HTMLTableElement | null>(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [cases, setCases] = useState<ExtendedCase[]>([]);
    const [filteredCases, setFilteredCases] = useState<ExtendedCase[]>([]);
    const { user, loading: authLoading } = useAuth();
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
            return dueDateParam ? new Date() : undefined;
        }
    );

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
    const [selectedOrderCases, setSelectedOrderCases] = useState<ExtendedCase[]>([]);

    ;



    const pagination = useMemo(
        () => ({
            pageIndex: paginationState.pageIndex,
            pageSize: pageSize,
        }),
        [paginationState, pageSize]
    );
    let date;
    //const location = useLocation();
    const previousPath = location.state?.from || "No previous path available";
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
        //     accessorKey: "select",
        //     header: ({ table }) => (
        //         <Checkbox
        //             checked={
        //                 table.getIsAllPageRowsSelected() ||
        //                 (table.getIsSomePageRowsSelected() && "indeterminate")
        //             }
        //             onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //             aria-label="Select all"
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             checked={row.getIsSelected()}
        //             onCheckedChange={(value) => {
        //                 row.toggleSelected(!!value);
        //                 if (value) {
        //                     setSelectedCases((items) => [...items, row.original.id]);
        //                 } else {
        //                     const cases = selectedCasesIds.filter(
        //                         (item) => item !== row.original.id
        //                     );
        //                     setSelectedCases(cases);
        //                 }
        //             }}
        //             aria-label="Select row"
        //         />
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },
        {
            accessorKey: "working_pan_color",
            header: ({ column }) => (
                <div className="flex items-center">
                    Pan
                </div>
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
                <div className="flex items-center">
                    Tag
                </div>
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
                <div className="flex items-center">
                    Case #
                </div>
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
                <div className="flex items-center">
                    Patient Name
                </div>
            ),
            cell: ({ row }) => <div>{row.getValue("patient_name")}</div>,
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <div className="flex items-center">
                    Status
                </div>
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
                <div className="flex items-center">
                    Doctor
                </div>
            ),
            cell: ({ row }) => {
                const doctor = row.getValue("doctor") as { name: string } | null;
                return <div>{doctor?.name || "N/A"}</div>;
            },
        },
        {
            accessorKey: "client",
            header: ({ column }) => (
                <div className="flex items-center">
                    Client
                </div>
            ),
            cell: ({ row }) => {
                const client = row.getValue("client") as { client_name: string } | null;
                return <div>{client?.client_name || "N/A"}</div>;
            },
        },
        {
            accessorKey: "due_date",
            header: ({ column }) => (
                <div className="flex items-center">
                    Due Date
                </div>
            ),
            cell: ({ row }) => {
                const dueDate = row.getValue("due_date") as string;
                const client = row.getValue("client") as { client_name: string; additional_lead_time?: string } | null;
                const parsedDate = calculateDueDate(dueDate, client ?? undefined);
                return parsedDate;
            },
            filterFn: (row, id, value: Date) => {
                if (!value) return true;
                let dueDate = row.getValue(id) as string;

                if (!dueDate) return false;
                let rowDate = new Date(dueDate);
                const filterDate = searchParams.get("dueDate");
                const formatedDate = filterDate ? new Date(filterDate) : null;
                const utcDate = formatedDate
                    ? formatedDate.setUTCDate(formatedDate.getUTCDate() + 1)
                    : null;

                return (
                    rowDate.getFullYear() === value.getFullYear() &&
                    rowDate.getMonth() === value.getMonth() &&
                    rowDate.getDate() === formatedDate?.getDate()
                );
            },
        },
        {
            accessorKey: "received_date",
            header: ({ column }) => (
                <div className="flex items-center">
                    Ordered Date
                </div>
            ),
            cell: ({ row }) => {
                const date = row.getValue("received_date") as string;
                const createdAt = row.original.created_at;

                return formatDate(date || createdAt);
            },
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
    const table = useReactTable({
        data: filteredCases,
        columns,
        pageCount: Math.ceil(filteredCases.length / pageSize),
        state: {
            rowSelection, // This should be correctly passed
            pagination: { pageIndex: paginationState.pageIndex, pageSize },
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    useEffect(() => {
        if (!location.state?.selectedCases) return;
        const selectedCases = location.state.selectedCases;
        setCases(selectedCases);
        setFilteredCases(selectedCases);
        const selectedIds = selectedCases.map((caseItem: any) => caseItem.id);
        setSelectedCases(selectedIds);
        const defaultSelection = Object.fromEntries(selectedIds.map((id: any) => [id, true]));
        setRowSelection(defaultSelection);

        console.log("Default Selected Row IDs:", selectedIds);
        console.log("Row Selection State:", defaultSelection);
    }, [location.state]);

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

    // const handlePrint = (selectedRows: Row<ExtendedCase>[]) => {
    //     console.log("Printing selected rows:", selectedRows);
    // };

    const handlePrint = () => {
        if (!tableRef.current) {
            console.error("Table reference is null!");
            return;
        }
    
        const printContent = tableRef.current.outerHTML; // Capture only the referenced div
        const printWindow = window.open("", "_blank");
    
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Order</title>
                        <style>
                            @media print {
                                * {
                                    box-sizing: border-box;
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                    margin: 0;
                                    padding: 0;
                                    background-color: white;
                                    color: black;
                                    width: 100%;
                                    height: 100%;
                                    overflow: hidden;
                                }
                                #printable-content {
                                    width: 100%;
                                    max-width: 100%;
                                    margin: 0;
                                    padding: 20px;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f2f2f2 !important;
                                }
    
                                /* Hide Everything Else */
                                body * {
                                    visibility: hidden;
                                }
                                #printable-content, #printable-content * {
                                    visibility: visible;
                                }
                                #printable-content {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    height: 100%;
                                }
    
                                /* Hide Print Button */
                                .print-button {
                                    display: none !important;
                                }
    
                                /* Ensure Colors in Print */
                                .row-icon {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div id="printable-content">
                            ${printContent}  <!-- Print only the referenced div -->
                        </div>
                    </body>
                </html>
            `);
    
            printWindow.document.close();
    
            printWindow.onload = () => {
                printWindow.print();
                printWindow.onafterprint = () => {
                    printWindow.close();
                };
            };
        } else {
            console.error("Popup blocked! Allow popups for this site.");
        }
    };
    
    
    


    const handlePrintOptionSelect = (option: string, selectedId?: string[]) => {
        const selectedCases = table
            .getSelectedRowModel()
            .rows.map((row) => row.original);

        if (selectedCases.length === 0 && !selectedId) return;

        const previewState = {
            type: option,
            paperSize: "LETTER", // Default paper size
            caseData:
                selectedCases.length > 0
                    ? selectedCases.map((caseItem) => ({
                        id: caseItem.id,
                        patient_name: caseItem.patient_name,
                        case_number: caseItem.case_number,
                        qr_code: `https://app.labulous.com/cases/${caseItem.id}`,
                        client: caseItem.client,
                        doctor: caseItem.doctor,
                        created_at: caseItem.created_at,
                        //due_date: caseItem.due_date,
                        due_date: calculateDueDate(caseItem.due_date, caseItem.client ?? undefined),
                        tag: caseItem.tag,
                    }))
                    : cases
                        .filter((item) =>
                            selectedId && selectedId.length > 0
                                ? selectedId.includes(item.id)
                                : selectedCasesIds.includes(item.id)
                        )
                        .map((caseItem) => ({
                            id: caseItem.id,
                            patient_name: caseItem.patient_name,
                            case_number: caseItem.case_number,
                            qr_code: `https://app.labulous.com/cases/${caseItem.id}`,
                            client: caseItem.client,
                            doctor: caseItem.doctor,
                            created_at: caseItem.created_at,
                            //due_date: caseItem.due_date,
                            due_date: calculateDueDate(caseItem.due_date, caseItem.client ?? undefined),
                            tag: caseItem.tag,
                        })),
            caseDetails: cases.filter((item) =>
                selectedId && selectedId.length > 0
                    ? selectedId.includes(item.id)
                    : selectedCasesIds.includes(item.id)
            ),


        };

        // Use a fixed storage key so that the data always overrides the previous entry.
        const storageKey = "printData";
        localStorage.setItem(storageKey, JSON.stringify(previewState));

        // Build the preview URL with the fixed key in the query string.
        const previewUrl = `${window.location.origin}/print-preview?stateKey=${storageKey}`;
        window.open(previewUrl, "_blank");
    };
    const amount = 20133;

    const handleSelectedOrderData = () => {
        const selectedOrderCases = table.getFilteredSelectedRowModel().rows.map(row => row.original);
        console.log("Selected Order Cases:", selectedOrderCases);
        if (selectedOrderCases.length === 0) {
            alert("No cases selected!");
            return;
        }
        setSelectedOrderCases(selectedOrderCases);
        navigate("selected-order-cases", { state: { selectedCases: selectedOrderCases } });
    };


    return (
        <div ref={tableRef} className="space-y-6">
            <PageHeader
                heading="Selected Order"
            >
            </PageHeader>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {Object.keys(rowSelection).length > 0 ? (
                            <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" >
                                            <PrinterIcon className="h-4 w-4 mr-2" />
                                            Print Order
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onClick={() => handlePrint()}
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Print Order
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : null}
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
            </div>
        </div>
    );
};

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


export default SelectedOrderCases;

