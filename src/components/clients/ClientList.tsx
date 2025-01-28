import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Check,
  X
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
import { createClientByAdmin } from "@/services/authService";
import { getLabIdByUserId } from "@/services/authService";
import { checkEmailExists } from "@/services/authService";
import toast from "react-hot-toast";

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [clients, setClients] = useState<Client[]>(initialClients);

  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  //Get UserID 
  const { user } = useAuth();
  const [labId, setLabId] = useState<string | null>(null);
  //console.log(labId);

  const [emailExistsMap, setEmailExistsMap] = useState<Record<string, boolean>>({});


  useEffect(() => {
    const loadClients = async () => {
      try {
        // Get LabID
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return;
        }
        setLabId(labData.labId);  // Set the lab ID here
      } catch (error) {
        console.error("Error loading clients:", error);
        toast.error("Failed to load clients list");
      }
    };
    loadClients();
  }, [user]);

  useEffect(() => {
    const checkEmails = async () => {
      const emailCheckResults: Record<string, boolean> = {};

      // Iterate over each client to check their email
      for (const client of clients) {
        const exists = await checkEmailExists(client.email);
        emailCheckResults[client.email] = exists;
      }

      setEmailExistsMap(emailCheckResults); // Save the results to state
    };

    checkEmails();
  }, [clients]);


  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateLoginModal = (clientId: string) => {
    const client = clients.find(client => client.id === clientId);
    if (client) {
      setSelectedClientId(clientId);
      setEmail(client.email); // Set email from the client data
      setShowModal(true);
    }
  };

  const closeCreateLoginModal = () => {
    setShowModal(false);
    setSelectedClientId(null);
    setEmail(""); // Reset email
    setPassword(""); // Reset password
    setConfirmPassword(""); // Reset confirm password
  };

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const handleCreateLogin = async () => {
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      setIsSubmitting(false); // Reset submission state
      return;
    }

    if (password.length < 8) {
      toast.error("Password should be at least 8 characters long.");
      setIsSubmitting(false); // Reset submission state
      return;
    }

    try {
      const client = clients.find(client => client.id === selectedClientId);

      if (!labId) {
        toast.error("Lab ID is required.");
        setIsSubmitting(false); // Reset submission state
        return;
      }

      if (client) {
        // Add a flag to prevent multiple calls
        if (!handleCreateLogin.called) {
          handleCreateLogin.called = true;

          await createClientByAdmin(
            labId,
            client.clientName,
            email,
            password,
            "client"
          );

          handleCreateLogin.called = false; // Reset the flag after successful call
        }
        toast(
          <div>
            <h4>🎉 Client Created Successfully</h4>
            <p>{client.clientName} has been added as a user.</p>
          </div>
        );
      }
      closeCreateLoginModal();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error creating login.");
      setIsSubmitting(false); // Reset submission state
    }
  };

  // Initialize the flag
  handleCreateLogin.called = false;

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
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            {row.getValue("email")}
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
      accessorKey: "has_login",
      header: "Has Login Credentials",
      cell: ({ row }) => {
        const client = row.original;
        const emailExists = emailExistsMap[client.email];
        return (
          <div className="flex items-center">
            {emailExists ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
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
        const emailExists = emailExistsMap[client.email];
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
              <DropdownMenuSeparator />
              {!emailExists && (
                <DropdownMenuItem
                  onClick={() => openCreateLoginModal(client.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Client Login
                </DropdownMenuItem>
              )}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-medium mb-4">Create Client Login</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateLogin();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={closeCreateLoginModal}>
                  Cancel
                </Button>
                {/* <Button type="submit" disabled={isSubmitting}> {isSubmitting ? "Submitting..." : "Submit"}</Button> */}
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <PageHeader
          heading="Clients"
          description="Manage your client accounts and information."
        >
          <Button onClick={() => navigate("/clients/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add New Client
          </Button>
        </PageHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter clients..."
              value={
                (table.getColumn("clientName")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("clientName")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {!header.isPlaceholder &&
                          flexRender(
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
                    <TableRow key={row.id}>
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
    </>
  );

};

export default ClientList;
