import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/services/searchService';
import { FileText, Users } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: () => void;
  isLoading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return null;
  }

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onSelect();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
      {results.map((result) => (
        <button
          key={`${result.type}-${result.id}`}
          onClick={() => handleSelect(result)}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
        >
          {result.type === 'case' ? (
            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {result.title}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {result.subtitle}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SearchResults;
