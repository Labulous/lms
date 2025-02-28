import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@tanstack/react-table";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/utils/logger";
import {
  Plus,
  ChevronsUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  MapPin,
  Phone,
  Mail,
  Building,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { AnyMxRecord } from "dns";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";

const logger = createLogger({ module: "ClientList" });

type Client = {
  id: string;
  created_at: string;
  clientName: string;
  email: string;
  phone: string;
  accountNumber: string;
  status?: string | undefined | any;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  tags: {
    color: string;
    name: string;
    id: string;
  };
};

interface ClientListProps {
  clients: any[];
  loading: boolean;
  onDeleteClient: (clientId: string) => void;
}



const ClientList: React.FC<ClientListProps> = ({
  clients: initialClients,
  loading,
  onDeleteClient,
}) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "clientName",
      desc: false,
    },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagFilter, setTagFilter] = useState<string[]>(() => {
    const tagParam = searchParams.get("tags");
    return tagParam ? tagParam.split(",") : [];
  });



  const [pageSize, setPageSize] = useState<number>(() => {
    return Number(localStorage.getItem("selectedPageSize")) || 10;
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize]);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    localStorage.setItem("selectedPageSize", newSize.toString());
  };


  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "accountNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Account #
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("accountNumber")}</div>
      ),
      filterFn: (row, id, value) => {
        const cellValue = row.getValue(id);
        return cellValue != null
          ? cellValue.toString().toLowerCase().includes(value.toLowerCase())
          : false;
      },
    },

    {
      accessorKey: "tags",
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
                <span className="text-sm font-medium">Filter by Tag</span>
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
                    clients
                      .filter((c) => c.tags?.name)
                      .map((c) =>
                        JSON.stringify({
                          name: c.tags?.name,
                          color: c.tags?.color,
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
        const ddd = row.getValue("accountNumber");
        if(ddd =="1024")
        {
          debugger;
        }
        const tag = row.getValue("tags") as { name: string; color: string };
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
      accessorKey: "clientName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Client Name
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
            <Link
              to={`/clients/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              {row.getValue("clientName")}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => {
        const address = row.original.address;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {address.city}, {address.state}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "billingEmail",
      header: "Email",
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            {row.getValue("billingEmail")}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
            {row.getValue("phone")}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as "active" | "inactive";
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggleStatus(client)}>
                {client.status === "Active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/clients/${client.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDeleteClient(client.id)}
              >
                Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: clients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });


  const handleToggleStatus = async (client: Client) => {
  try {
    const message = client.status === "Active"
      ? "Are you sure you want to deactivate this client?"
      : "Are you sure you want to activate this client?";

    if (!window.confirm(message)) {
      return;
    }

    // Determine new status values
    const newIsActive = client.status === "Active" ? false : true;
    const newStatus = newIsActive ? "Active" : "Inactive";

    const { error } = await supabase
      .from("clients")
      .update({
        isActive: newIsActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    if (error) throw error;

    toast.success("Client status updated successfully");

    // Update state without refetching
    setClients((prevClients) =>
      prevClients.map((c) =>
        c.id === client.id ? { ...c, status: newStatus, isActive: newIsActive } : c
      )
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to update client status");
  }
};


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  function getContrastColor(hexcolor: string): string {
    if (!hexcolor || hexcolor === "transparent") return "red";
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Client Management"
        description="Manage your client accounts and information."
      >
        <Button onClick={() => navigate("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by client name..."
            value={
              (table.getColumn("clientName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("clientName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Filter by account #..."
            value={
              (table.getColumn("accountNumber")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("accountNumber")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
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
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-4">
            <select
              value={table.getState().pagination.pageSize}
              // onChange={(e) => {
              //   table.setPageSize(Number(e.target.value));
              // }}
              onChange={handlePageSizeChange}
              className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background"
            >
              {[10, 30, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

export default ClientList;
