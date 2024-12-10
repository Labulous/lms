import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, PauseCircle, Package, Plus, ChevronUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import CaseFilters from './CaseFilters';
import PrintButtonWithDropdown from './PrintButtonWithDropdown';
import { supabase } from '@/lib/supabase';
import { Case } from '@/types/supabase';
import { format, isEqual, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';

const logger = createLogger({ module: 'CaseList' });

type Case = Database['public']['Tables']['cases']['Row'] & {
  client_name?: string;
  doctor_name?: string;
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
      accessorKey: "caseId",
      header: "Invoice ID",
      cell: ({ row }) => (
        <div className="font-semibold">{row.getValue("caseId")}</div>
      ),
    },
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div>{row.getValue("patientName") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Client",
    },
    {
      accessorKey: "doctor_name",
      header: "Doctor",
      cell: ({ row }) => (
        <div>{row.getValue("doctor_name") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "caseStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("caseStatus") as string;
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            status === 'Completed' ? 'bg-green-100 text-green-800' :
            status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = row.getValue("dueDate") as string;
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
            <Link to={`/cases/${caseId}`} className="text-indigo-600 hover:text-indigo-900">
              View
            </Link>
            <Link to={`/cases/${caseId}/edit`} className="text-indigo-600 hover:text-indigo-900">
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
          logger.debug('No user found in auth context');
          setLoading(false);
          return;
        }

        if (!user.id || !user.role) {
          logger.error('User missing required fields', { 
            hasId: !!user.id, 
            hasRole: !!user.role 
          });
          throw new Error('User is missing required fields');
        }

        logger.debug('Starting case fetch with user:', {
          userId: user.id,
          role: user.role,
          email: user.email
        });

        // First verify the user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          logger.error('No active session');
          throw new Error('No active session');
        }

        logger.debug('Current session:', {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
          expires_at: session.expires_at
        });

        // First try to fetch the specific test case
        const { data: testCase, error: testError } = await supabase
          .from('cases')
          .select(`
            id,
            created_at,
            updated_at,
            created_by,
            client_id,
            doctor_id,
            patient_name,
            rx_number,
            due_date,
            qr_code,
            status,
            notes
          `)
          .eq('id', '078d7fb1-5abd-4a79-bd10-7083bbed807b');

        if (testError) {
          logger.error('Error fetching test case:', {
            error: testError,
            message: testError.message,
            details: testError.details,
            hint: testError.hint
          });
          // Don't throw, just log the error and continue
        } else {
          logger.debug('Test case query:', {
            data: testCase,
            count: testCase?.length
          });
        }

        // Then fetch all cases
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select(`
            id,
            created_at,
            updated_at,
            created_by,
            client_id,
            doctor_id,
            patient_name,
            rx_number,
            due_date,
            qr_code,
            status,
            notes
          `)
          .order('created_at', { ascending: false });

        logger.debug('All cases query:', {
          data: casesData,
          error: casesError?.message,
          details: casesError?.details,
          hint: casesError?.hint
        });

        if (casesError) {
          throw casesError;
        }

        if (!casesData || casesData.length === 0) {
          logger.debug('No cases found');
          setCases([]);
          setFilteredCases([]);
          setLoading(false);
          return;
        }

        // Transform and set initial cases
        const transformedCases = casesData.map(caseItem => ({
          ...caseItem,
          client_name: 'Loading...', // We'll fetch client names separately
          doctor_name: caseItem.doctor_id ? 'Loading...' : 'N/A'
        }));

        logger.debug('Transformed cases:', transformedCases);

        setCases(transformedCases);
        setFilteredCases(transformedCases);

        // Get unique IDs for related data
        const clientIds = [...new Set(casesData.map(c => c.client_id))];
        const doctorIds = [...new Set(casesData.map(c => c.doctor_id).filter(Boolean))];

        logger.debug('Related IDs:', { clientIds, doctorIds });

        // Only fetch if we have IDs to fetch
        const [clientsResponse, doctorsResponse] = await Promise.all([
          clientIds.length > 0
            ? supabase
                .from('clients')
                .select('id, client_name')
                .in('id', clientIds)
            : Promise.resolve({ data: [], error: null }),
          doctorIds.length > 0
            ? supabase
                .from('doctors')
                .select('id, name')
                .in('id', doctorIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        logger.debug('Related data responses:', {
          clients: clientsResponse,
          doctors: doctorsResponse
        });

        // Handle any errors in fetching related data
        if (clientsResponse.error) {
          logger.error('Error fetching clients:', clientsResponse.error);
        }

        if (doctorsResponse.error) {
          logger.error('Error fetching doctors:', doctorsResponse.error);
        }

        // Create lookup maps for related data
        const clientMap = new Map(clientsResponse.data?.map(c => [c.id, c.client_name]) || []);
        const doctorMap = new Map(doctorsResponse.data?.map(d => [d.id, d.name]) || []);

        logger.debug('Data maps:', {
          clients: Object.fromEntries(clientMap),
          doctors: Object.fromEntries(doctorMap)
        });

        // Update cases with related data
        const finalCases = transformedCases.map(caseItem => ({
          ...caseItem,
          client_name: clientMap.get(caseItem.client_id) || 'Unknown Client',
          doctor_name: caseItem.doctor_id 
            ? doctorMap.get(caseItem.doctor_id) || 'Unknown Doctor'
            : 'N/A'
        }));

        logger.debug('Final cases:', finalCases);

        setCases(finalCases);
        setFilteredCases(finalCases);
      } catch (err) {
        logger.error('Error fetching cases:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch cases');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch cases if auth is not loading and we have a user
    if (!authLoading && user) {
      fetchCases();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (cases.length > 0) {
      let filtered = [...cases];
      const dueDateParam = searchParams.get('dueDate');

      if (dueDateParam) {
        filtered = filtered.filter(caseItem => {
          const caseDate = format(parseISO(caseItem.dueDate), 'yyyy-MM-dd');
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
      filtered = filtered.filter(caseItem => {
        const dueDate = parseISO(caseItem.dueDate);
        return isValid(dueDate) && isEqual(dueDate, today);
      });
    }

    if (filters.status) {
      filtered = filtered.filter(caseItem => caseItem.caseStatus === filters.status);
    }

    setFilteredCases(filtered);
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = cases.filter(caseItem =>
      caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseId.toLowerCase().includes(searchTerm.toLowerCase())
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
        return 'Invalid Date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      logger.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading cases...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const dueDateParam = searchParams.get('dueDate');
  const headerText = dueDateParam && isValid(parseISO(dueDateParam))
    ? `Cases Due on ${format(parseISO(dueDateParam), 'MMMM d, yyyy')}`
    : 'Case Management';

  return (
    <div className="container mx-auto px-4 py-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">{headerText}</h1>
        <Button
          onClick={() => navigate('/cases/new')}
          className="inline-flex items-center"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add New Case
        </Button>
      </div>

      <CaseFilters onFilterChange={handleFilterChange} onSearch={handleSearch} />
      
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