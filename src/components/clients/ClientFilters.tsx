import React, { useState } from 'react';

interface ClientFiltersProps {
  onFilterChange: (filters: any) => void;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ searchTerm: value });
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search clients..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
};

export default ClientFilters;