import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/services/searchService';
import { FileText, Users, Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: () => void;
  isLoading: boolean;
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, isLoading, query }) => {
  const navigate = useNavigate();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Searching...</span>
        </div>
      );
    }

    if (!results.length && query.trim()) {
      return (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">
            No results found for "{query}"
          </p>
        </div>
      );
    }

    if (!results.length) {
      return null;
    }

    return results.map((result) => (
      <button
        key={`${result.type}-${result.id}`}
        onClick={() => {
          navigate(result.url);
          onSelect();
        }}
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
    ));
  };

  if (!query.trim() && !isLoading) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
      {renderContent()}
    </div>
  );
};

export default SearchResults;
