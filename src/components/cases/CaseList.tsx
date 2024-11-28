import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, PauseCircle, Package, Plus, ChevronUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import CaseFilters from './CaseFilters';
import PrintButtonWithDropdown from './PrintButtonWithDropdown';
import { getCases, Case } from '@/data/mockCasesData';
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

const CaseList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      accessorKey: "clientName",
      header: "Clinic",
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => (
        <div>{row.getValue("doctorName") || "N/A"}</div>
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
    const allCases = getCases();
    setCases(allCases);
    setLoading(false);
  }, []);

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
      caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCases(filtered);
  };

  const handlePrintOptionSelect = (option: string) => {
    const selectedIds = Object.keys(rowSelection);
    console.log(`Print option selected: ${option} for cases:`, selectedIds);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Invalid Date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
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