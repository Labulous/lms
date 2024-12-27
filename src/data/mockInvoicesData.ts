import { format, addDays } from "date-fns";
import { mockClients } from "./mockClientsData";

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
  patient: string;
  client: string;
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
    type: "percentage" | "fixed";
    value: number;
    amount?: number;
  };
  tax: {
    value: number;
    amount: number;
  };
  totalAmount: number;
  amount: number;
  balance: number;
  status:
    | "draft"
    | "pending"
    | "paid"
    | "partially_paid"
    | "overdue"
    | "cancelled";
  paymentTerms: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const today = new Date();

// Create default mock invoices
const createDefaultInvoices = (): Invoice[] => {
  if (!mockClients || mockClients.length < 2) {
    console.warn(
      "Not enough mock clients available. Returning empty invoice array."
    );
    return [];
  }

  const invoices: Invoice[] = [];
  const patients = [
    "John Smith",
    "Sarah Johnson",
    "Michael Brown",
    "Emma Davis",
    "James Wilson",
  ];

  for (let i = 1; i <= 20; i++) {
    const client = mockClients[Math.floor(Math.random() * mockClients.length)];
    const amount = Math.floor(Math.random() * 5000) + 500;
    const paidAmount = Math.floor(Math.random() * amount);
    const invoice: Invoice = {
      id: `inv-${i}`,
      invoiceNumber: `INV-${String(i).padStart(4, "0")}`,
      clientId: client.id,
      clientName: client.clientName,
      patient: patients[Math.floor(Math.random() * patients.length)],
      client: client.clientName,
      clientAddress: client.address,
      date: format(
        addDays(today, -Math.floor(Math.random() * 30)),
        "yyyy-MM-dd"
      ),
      dueDate: format(
        addDays(today, Math.floor(Math.random() * 30)),
        "yyyy-MM-dd"
      ),
      items: [
        {
          id: `item-${i}-1`,
          description: "Dental Service",
          quantity: 1,
          unitPrice: amount,
          totalPrice: amount,
        },
      ],
      subTotal: amount,
      tax: {
        value: 0.1,
        amount: amount * 0.1,
      },
      totalAmount: amount * 1.1,
      amount: amount,
      balance: amount - paidAmount,
      status: [
        "draft",
        "pending",
        "paid",
        "overdue",
        "cancelled",
        "partially_paid",
      ][Math.floor(Math.random() * 6)] as
        | "draft"
        | "pending"
        | "paid"
        | "overdue"
        | "cancelled"
        | "partially_paid",
      paymentTerms: "Net 30",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    invoices.push(invoice);
  }

  return invoices;
};

// Load invoices from localStorage or use default data
const loadInvoices = (): Invoice[] => {
  const savedInvoices = localStorage.getItem("invoices");
  if (savedInvoices) {
    return JSON.parse(savedInvoices);
  }
  return createDefaultInvoices();
};

// Initialize invoices
let invoices = loadInvoices();

// Save invoices to localStorage
const saveInvoices = (data: Invoice[]) => {
  localStorage.setItem("invoices", JSON.stringify(data));
};

// Export the mock invoices for direct access
export { invoices as mockInvoices };

// CRUD operations
export const getInvoices = (): Invoice[] => {
  return invoices;
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return invoices.find((invoice) => invoice.id === id);
};

export const getInvoicesByClientId = (clientId: string): Invoice[] => {
  return invoices.filter((invoice) => invoice.clientId === clientId);
};

export const getInvoicesByStatus = (status: Invoice["status"]): Invoice[] => {
  return invoices.filter((invoice) => invoice.status === status);
};

export const getOverdueInvoices = (): Invoice[] => {
  const today = new Date();
  return invoices.filter(
    (invoice) =>
      invoice.status === "overdue" ||
      (invoice.status === "pending" && new Date(invoice.dueDate) < today)
  );
};

export const addInvoice = (
  invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">
): Invoice => {
  const newInvoice: Invoice = {
    ...invoice,
    id: Date.now().toString(),
    createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  };

  invoices = [...invoices, newInvoice];
  saveInvoices(invoices);
  return newInvoice;
};

export const updateInvoice = (id: string, data: Partial<Invoice>): Invoice => {
  const invoice = getInvoiceById(id);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    ...data,
    updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  };

  invoices = invoices.map((inv) => (inv.id === id ? updatedInvoice : inv));
  saveInvoices(invoices);
  return updatedInvoice;
};

export const deleteInvoice = (id: string): void => {
  invoices = invoices.filter((invoice) => invoice.id !== id);
  saveInvoices(invoices);
};
