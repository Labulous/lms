import React, { useEffect, useState, useRef } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchLabId = async () => {
      try {
        const labData = await getLabIdByUserId(userId);
        logger.debug('Lab data fetched:', labData);
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

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [setQuery]);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelect = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="flex-1 max-w-lg mx-8" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleInputFocus}
          placeholder="Search cases or clients..."
          className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        {isOpen && (query.trim() || isLoading) && (
          <SearchResults
            results={results}
            isLoading={isLoading}
            onSelect={handleSelect}
            query={query}
          />
        )}
      </div>
    </div>
  );
};

export default SearchBar;
