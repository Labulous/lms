import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className = '',
  align = 'left',
}) => {
  const isActive = currentSort === sortKey;

  return (
    <th
      className={`px-6 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''} ${align === 'center' ? 'justify-center' : ''}`}>
        <span>{label}</span>
        <span className="ml-2 flex flex-col">
          <ChevronUp
            className={`h-3 w-3 -mb-1 ${
              isActive && currentDirection === 'asc'
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 ${
              isActive && currentDirection === 'desc'
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          />
        </span>
      </div>
    </th>
  );
};

export default SortableTableHeader;