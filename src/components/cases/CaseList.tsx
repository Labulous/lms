import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, PauseCircle, Package, Plus } from 'lucide-react';
import CaseFilters from './CaseFilters';
import PrintButtonWithDropdown from './PrintButtonWithDropdown';
import { getCases, Case } from '../../data/mockCasesData';
import { format, isEqual, parseISO, isValid } from 'date-fns';
import SortableTableHeader from '../common/SortableTableHeader';
import { useSortableData } from '../../hooks/useSortableData';

const CaseList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);

  const { items: sortedCases, requestSort, sortConfig } = useSortableData(filteredCases);

  useEffect(() => {
    // Get cases from our data store
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
    console.log(`Print option selected: ${option} for cases:`, selectedCases);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCases(sortedCases.map(caseItem => caseItem.id));
    } else {
      setSelectedCases([]);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCases(prev => {
      if (prev.includes(caseId)) {
        return prev.filter(id => id !== caseId);
      } else {
        return [...prev, caseId];
      }
    });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">{headerText}</h1>
        <button
          onClick={() => navigate('/cases/new')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <Plus className="mr-2" size={20} />
          Add New Case
        </button>
      </div>

      <CaseFilters onFilterChange={handleFilterChange} onSearch={handleSearch} />
      
      <div className="mb-4">
        <PrintButtonWithDropdown 
          caseId="" 
          onPrintOptionSelect={handlePrintOptionSelect}
          disabled={selectedCases.length === 0}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100">
                <input
                  type="checkbox"
                  checked={selectedCases.length === sortedCases.length}
                  onChange={handleSelectAll}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
              </th>
              <SortableTableHeader
                label="Invoice ID"
                sortKey="invoiceId"
                currentSort={sortConfig.key}
                currentDirection={sortConfig.direction}
                onSort={requestSort}
              />
              <SortableTableHeader
                label="Patient"
                sortKey="patientName"
                currentSort={sortConfig.key}
                currentDirection={sortConfig.direction}
                onSort={requestSort}
              />
              <SortableTableHeader
                label="Clinic"
                sortKey="clientName"
                currentSort={sortConfig.key}
                currentDirection={sortConfig.direction}
                onSort={requestSort}
              />
              <SortableTableHeader
                label="Doctor"
                sortKey="doctorName"
                currentSort={sortConfig.key}
                currentDirection={sortConfig.direction}
                onSort={requestSort}
              />
              <SortableTableHeader
                label="Status"
                sortKey="caseStatus"
                currentSort={sortConfig.key}
                currentDirection={sortConfig.direction}
                onSort={requestSort}
              />
              <SortableTableHeader
                label="Due Date"
                sortKey="dueDate"
                currentSort={sortConfig.key}
                currentDirection={sortConfig.direction}
                onSort={requestSort}
              />
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td className="px-5 py-4 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedCases.includes(caseItem.id)}
                    onChange={() => handleSelectCase(caseItem.id)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-gray-900 whitespace-no-wrap font-semibold">
                    {caseItem.caseId}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {caseItem.patientName || 'N/A'}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {caseItem.clientName}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {caseItem.doctorName || 'N/A'}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    caseItem.caseStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                    caseItem.caseStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {caseItem.caseStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {formatDate(caseItem.dueDate)}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/cases/${caseItem.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    View
                  </Link>
                  <Link to={`/cases/${caseItem.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CaseList;