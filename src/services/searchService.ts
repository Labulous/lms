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

class SearchService {
  private async searchCases(query: string, labId: string): Promise<SearchResult[]> {
    try {
      const { data: cases, error } = await supabase
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
        .or(`patient_name.ilike.%${query}%,case_number.eq.${query},clients!inner(client_name.ilike.%${query}%)`)
        .limit(5);

      if (error) {
        logger.error('Error searching cases:', error);
        return [];
      }

      return (cases || []).map(caseItem => ({
        type: 'case',
        id: caseItem.id,
        title: `${caseItem.patient_name} (Case #${caseItem.case_number})`,
        subtitle: `Client: ${caseItem.clients[0]?.client_name || 'Unknown'}`,
        url: `/cases/${caseItem.id}`
      }));
    } catch (error) {
      logger.error('Error in searchCases:', error);
      return [];
    }
  }

  private async searchClients(query: string, labId: string): Promise<SearchResult[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, client_name, account_number')
        .eq('lab_id', labId)
        .or(`client_name.ilike.%${query}%,account_number.ilike.%${query}%`)
        .limit(5);

      if (error) {
        logger.error('Error searching clients:', error);
        return [];
      }

      return (clients || []).map(client => ({
        type: 'client',
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
      const [cases, clients] = await Promise.all([
        this.searchCases(query.trim(), labId),
        this.searchClients(query.trim(), labId)
      ]);

      return [...cases, ...clients];
    } catch (error) {
      logger.error('Error in search:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
