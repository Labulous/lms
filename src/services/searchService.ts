import { supabase } from "@/lib/supabase";
import { createLogger } from "@/utils/logger";

const logger = createLogger({ module: "SearchService" });

export interface SearchResult {
  type: 'case' | 'client';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

interface CaseWithClient {
  id: string;
  case_number: string;
  patient_name: string;
  clients: {
    id: string;
    client_name: string;
  } | null;
}

interface Client {
  id: string;
  client_name: string;
  account_number: string;
}

class SearchService {
  private async searchCases(query: string, labId: string): Promise<SearchResult[]> {
    try {
      logger.debug('Searching cases with:', { query, labId });

      // First try exact case number match
      const { data: exactMatches, error: exactError } = await supabase
        .from('cases')
        .select(`
          id,
          case_number,
          patient_name,
          clients (
            id,
            client_name
          )
        `)
        .eq('lab_id', labId)
        .eq('case_number', query)
        .limit(5) as { data: CaseWithClient[] | null; error: any };

      if (exactError) {
        logger.error('Error in exact case search:', exactError);
        return [];
      }

      // Then try exact patient name match
      const { data: exactPatientMatches, error: exactPatientError } = await supabase
        .from('cases')
        .select(`
          id,
          case_number,
          patient_name,
          clients (
            id,
            client_name
          )
        `)
        .eq('lab_id', labId)
        .ilike('patient_name', query)
        .order('created_at', { ascending: false })
        .limit(5) as { data: CaseWithClient[] | null; error: any };

      if (exactPatientError) {
        logger.error('Error in exact patient name search:', exactPatientError);
        return [];
      }

      // Then try partial matches for both patient name and case number
      const { data: partialMatches, error: partialError } = await supabase
        .from('cases')
        .select(`
          id,
          case_number,
          patient_name,
          clients (
            id,
            client_name
          )
        `)
        .eq('lab_id', labId)
        .or(`patient_name.ilike.%${query}%,case_number.ilike.%${query}%`)
        .not('case_number', 'eq', query) // Exclude exact case number matches
        .not('patient_name', 'ilike', query) // Exclude exact patient name matches
        .order('created_at', { ascending: false })
        .limit(10) as { data: CaseWithClient[] | null; error: any };

      if (partialError) {
        logger.error('Error in partial case search:', partialError);
        return [];
      }

      // Combine results with priority: exact case number > exact patient name > partial matches
      const allCases = [
        ...(exactMatches || []),
        ...(exactPatientMatches || []),
        ...(partialMatches || [])
      ];

      logger.debug('Cases found:', { 
        count: allCases.length, 
        exactMatches: exactMatches?.length || 0,
        exactPatientMatches: exactPatientMatches?.length || 0,
        partialMatches: partialMatches?.length || 0,
        query
      });

      return allCases.map(caseItem => ({
        type: 'case' as const,
        id: caseItem.id,
        title: `${caseItem.patient_name} (Inv #${caseItem.case_number})`,
        subtitle: `Client: ${caseItem.clients?.client_name || 'Unknown'}`,
        url: `/cases/${caseItem.id}`
      }));
    } catch (error) {
      logger.error('Error in searchCases:', error);
      return [];
    }
  }

  private async searchClients(query: string, labId: string): Promise<SearchResult[]> {
    try {
      logger.debug('Searching clients with:', { query, labId });

      // First try exact account number match
      const { data: exactMatches, error: exactError } = await supabase
        .from('clients')
        .select('id, client_name, account_number')
        .eq('lab_id', labId)
        .eq('account_number', query)
        .limit(5) as { data: Client[] | null; error: any };

      if (exactError) {
        logger.error('Error in exact client search:', exactError);
        return [];
      }

      // Then try partial matches for both account number and name
      const { data: partialMatches, error: partialError } = await supabase
        .from('clients')
        .select('id, client_name, account_number')
        .eq('lab_id', labId)
        .or(`client_name.ilike.%${query}%,account_number.ilike.%${query}%`)
        .not('account_number', 'eq', query) // Exclude exact matches we already have
        .order('client_name', { ascending: true })
        .limit(10) as { data: Client[] | null; error: any };

      if (partialError) {
        logger.error('Error in partial client search:', partialError);
        return [];
      }

      const allClients = [...(exactMatches || []), ...(partialMatches || [])];
      logger.debug('Clients found:', {
        count: allClients.length,
        exactMatches: exactMatches?.length || 0,
        partialMatches: partialMatches?.length || 0,
        query,
        results: allClients.map(c => ({ 
          name: c.client_name, 
          account: c.account_number 
        }))
      });

      return allClients.map(client => ({
        type: 'client' as const,
        id: client.id,
        title: client.client_name,
        subtitle: `Account #${client.account_number || 'N/A'}`,
        url: `/clients/${client.id}`
      }));
    } catch (error) {
      logger.error('Error in searchClients:', error);
      return [];
    }
  }

  async search(query: string, labId: string): Promise<SearchResult[]> {
    if (!query?.trim() || !labId) {
      return [];
    }

    try {
      logger.debug('Starting combined search:', { query, labId });

      const [cases, clients] = await Promise.all([
        this.searchCases(query.trim(), labId),
        this.searchClients(query.trim(), labId)
      ]);

      const results = [...cases, ...clients];
      logger.debug('Search complete:', {
        totalResults: results.length,
        casesFound: cases.length,
        clientsFound: clients.length,
        query
      });

      return results;
    } catch (error) {
      logger.error('Error in search:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
