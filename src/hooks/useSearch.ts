import { useState, useEffect } from 'react';
import { searchService, SearchResult } from '@/services/searchService';
import { createLogger } from '@/utils/logger';

const logger = createLogger({ module: 'useSearch' });

export function useSearch(labId: string | null) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(async () => {
      if (!query.trim() || !labId) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await searchService.search(query, labId);
        if (isCurrent) {
          setResults(searchResults);
        }
      } catch (error) {
        logger.error('Search error:', error);
        if (isCurrent) {
          setResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }, 300); // Debounce for 300ms

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query, labId]);

  return {
    query,
    setQuery,
    results,
    isLoading,
  };
}
