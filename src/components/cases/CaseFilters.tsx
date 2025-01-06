import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface CaseFiltersProps {
  onFilterChange: (filters: any) => void;
  onSearch: (searchTerm: string) => void;
}

const CaseFilters: React.FC<CaseFiltersProps> = ({ onFilterChange, onSearch }) => {
  const [filters, setFilters] = useState({
    dueDate: '',
    status: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between">
      <div className="flex space-x-4 mb-4 sm:mb-0">
        <select
          name="dueDate"
          onChange={handleFilterChange}
          className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm"
        >
          <option value="">All Due Dates</option>
          <option value="Today">Today</option>
          <option value="Tomorrow">Tomorrow</option>
          <option value="This Week">This Week</option>
        </select>
        <select
          name="status"
          onChange={handleFilterChange}
          className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search cases..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default CaseFilters;