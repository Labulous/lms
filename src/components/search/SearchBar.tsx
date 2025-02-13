import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getLabIdByUserId } from '@/services/authService';
import { useSearch } from '@/hooks/useSearch';
import SearchResults from './SearchResults';
import { createLogger } from '@/utils/logger';

const logger = createLogger({ module: 'SearchBar' });

interface SearchBarProps {
  userId: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ userId }) => {
  const [labId, setLabId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLabId = async () => {
      try {
        const labData = await getLabIdByUserId(userId);
        if (labData) {
          setLabId(labData.labId);
        }
      } catch (error) {
        logger.error('Error fetching lab ID:', error);
      }
    };

    if (userId) {
      fetchLabId();
    }
  }, [userId]);

  const { query, setQuery, results, isLoading } = useSearch(labId);

  return (
    <div className="flex-1 max-w-lg mx-8">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases or clients..."
          className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        {query.trim() && (
          <SearchResults
            results={results}
            isLoading={isLoading}
            onSelect={() => setQuery('')}
          />
        )}
      </div>
    </div>
  );
};

export default SearchBar;
