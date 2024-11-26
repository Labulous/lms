import { format, addDays } from 'date-fns';
import { mockClients } from './mockClientsData';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  caseId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subTotal: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  tax: {
    value: number;
    amount: number;
  };
  totalAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const today = new Date();

// Create default mock invoices using the first two clients
const createDefaultInvoices = (): Invoice[] => {
  // Add safety check for clients
  if (!mockClients || mockClients.length < 2) {
    console.warn('Not enough mock clients available. Returning empty invoice array.');
    return [];
  }

  const [client1, client2] = mockClients;

  return [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      clientId: client1.id,
      clientName: client1.clientName,
      clientAddress: client1.address,
      date: format(today, 'yyyy-MM-dd'),
      dueDate: format(addDays(today, 30), 'yyyy-MM-dd'),
      items: [
        {
          id: '1',
          description: 'Full Upper Arch Restoration',
          quantity: 1,
          unitPrice: 1200.00,
          totalPrice: 1200.00,
          caseId: 'CASE001'
        },
        {
          id: '2',
          description: 'Custom Shading',
          quantity: 1,
          unitPrice: 150.00,
          totalPrice: 150.00,
          caseId: 'CASE001'
        }
      ],
      subTotal: 1350.00,
      tax: {
        value: 13,
        amount: 175.50
      },
      totalAmount: 1525.50,
      status: 'pending',
      paymentTerms: 'Net 30',
      notes: 'Please review and approve the restoration work.',
      createdAt: format(today, 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(today, 'yyyy-MM-dd HH:mm:ss')
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      clientId: client2.id,
      clientName: client2.clientName,
      clientAddress: client2.address,
      date: format(addDays(today, -15), 'yyyy-MM-dd'),
      dueDate: format(addDays(today, 15), 'yyyy-MM-dd'),
      items: [
        {
          id: '3',
          description: 'Porcelain Veneers (4 units)',
          quantity: 4,
          unitPrice: 300.00,
          totalPrice: 1200.00,
          caseId: 'CASE002'
        }
      ],
      subTotal: 1200.00,
      discount: {
        type: 'percentage',
        value: 10,
        amount: 120.00
      },
      tax: {
        value: 13,
        amount: 140.40
      },
      totalAmount: 1220.40,
      status: 'paid',
      paymentTerms: 'Net 30',
      createdAt: format(addDays(today, -15), 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(addDays(today, -15), 'yyyy-MM-dd HH:mm:ss')
    }
  ];
};

// Load invoices from localStorage or use default data
const loadInvoices = (): Invoice[] => {
  const savedInvoices = localStorage.getItem('invoices');
  if (savedInvoices) {
    return JSON.parse(savedInvoices);
  }
  return createDefaultInvoices();
};

// Initialize invoices
let invoices = loadInvoices();

// Save invoices to localStorage
const saveInvoices = (data: Invoice[]) => {
  localStorage.setItem('invoices', JSON.stringify(data));
};

// Export the mock invoices for direct access
export { invoices as mockInvoices };

// CRUD operations
export const getInvoices = (): Invoice[] => {
  return invoices;
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return invoices.find(invoice => invoice.id === id);
};

export const getInvoicesByClientId = (clientId: string): Invoice[] => {
  return invoices.filter(invoice => invoice.clientId === clientId);
};

export const getInvoicesByStatus = (status: Invoice['status']): Invoice[] => {
  return invoices.filter(invoice => invoice.status === status);
};

export const getOverdueInvoices = (): Invoice[] => {
  const today = new Date();
  return invoices.filter(invoice => 
    invoice.status === 'overdue' || 
    (invoice.status === 'pending' && new Date(invoice.dueDate) < today)
  );
};

export const addInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice => {
  const newInvoice: Invoice = {
    ...invoice,
    id: Date.now().toString(),
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
  
  invoices = [...invoices, newInvoice];
  saveInvoices(invoices);
  return newInvoice;
};

export const updateInvoice = (id: string, data: Partial<Invoice>): Invoice => {
  const invoice = getInvoiceById(id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    ...data,
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };

  invoices = invoices.map(inv => inv.id === id ? updatedInvoice : inv);
  saveInvoices(invoices);
  return updatedInvoice;
};

export const deleteInvoice = (id: string): void => {
  invoices = invoices.filter(invoice => invoice.id !== id);
  saveInvoices(invoices);
};