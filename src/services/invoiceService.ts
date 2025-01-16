import { supabase } from "../lib/supabase";

export interface Invoice {
  id: string;
  created_at: string;
  case_id: string;
  client_id: string;
  amount: number;
  due_date: string;
  status: string;
  lab_id: string;
  due_amount: number;
  updated_at: string;
}

class InvoiceService {
  async getInvoices(labId: string): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          *,
          client:clients(id, client_name)
        `)
        .eq("lab_id", labId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invoices", { error });
        throw error;
      }

      return invoices;
    } catch (error) {
      console.error("Error in getInvoices", { error });
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select(`
          *,
          client:clients(id, client_name)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching invoice", { error });
        throw error;
      }

      return invoice;
    } catch (error) {
      console.error("Error in getInvoiceById", { error });
      throw error;
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating invoice", { error });
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in updateInvoice", { error });
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
