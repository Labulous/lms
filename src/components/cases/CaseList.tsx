import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, PauseCircle } from 'lucide-react';
import CaseProgress from './CaseProgress';
import CaseFilters from './CaseFilters';
import PrintButtonWithDropdown from './PrintButtonWithDropdown';
import { fetchCases } from '../../services/api';

interface Case {
  id: string;
  clientName: string;
  patientName: string;
  dueDate: string;
  currentStage: string;
  progress: number;
  status: 'In Progress' | 'Completed' | 'On Hold';
}

const CaseList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCaseData();
  }, []);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching cases...');
      const fetchedCases = await fetchCases();
      console.log('Fetched cases:', fetchedCases);
      setCases(fetchedCases);
      setFilteredCases(fetchedCases);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to load cases. ${errorMessage}`);
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    // Implement filtering logic here
    const filtered = cases.filter(caseItem => {
      if (filters.dueDate === 'Today' && new Date(caseItem.dueDate).toDateString() !== new Date().toDateString()) return false;
      if (filters.status && caseItem.status !== filters.status) return false;
      return true;
    });
    setFilteredCases(filtered);
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = cases.filter(caseItem =>
      caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCases(filtered);
  };

  const handlePrintOptionSelect = (option: string) => {
    // Implement print functionality here
    console.log(`Print option selected: ${option}`);
  };

  console.log('Rendering CaseList, cases:', cases);
  console.log('Rendering CaseList, filteredCases:', filteredCases);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Case Management</h1>
      <CaseFilters onFilterChange={handleFilterChange} onSearch={handleSearch} />
      <div className="mb-4">
        <PrintButtonWithDropdown caseId="" onPrintOptionSelect={handlePrintOptionSelect} />
      </div>
      {filteredCases.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">No cases found.</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Client / Patient
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem) => (
                <tr key={caseItem.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <Link to={`/cases/${caseItem.id}`} className="hover:text-blue-500">
                      <div className="flex items-center">
                        <div className="ml-3">
                          <p className="text-gray-900 whitespace-no-wrap font-semibold">
                            {caseItem.clientName}
                          </p>
                          <p className="text-gray-600 whitespace-no-wrap">{caseItem.patientName}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{new Date(caseItem.dueDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{caseItem.currentStage}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <CaseProgress progress={caseItem.progress} />
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      caseItem.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      caseItem.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {caseItem.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CaseList;