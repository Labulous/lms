import { format, addDays } from "date-fns";
import { mockClients } from "./mockClientsData";
import { Case } from "./mockCasesData";

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  caseId?: string;
  toothNumber: string;
  discount: number;
  notes?: {
    labNotes: string;
    invoiceNotes: string;
  };
}

type Product = {
  id: string;
  name: string;
  price: number;
  lead_time: number | null;
  is_client_visible: boolean;
  is_taxable: boolean;
  created_at: string;
  updated_at: string;
  requires_shade: boolean;
  material: {
    name: string;
    is_active: boolean;
    description: string;
  };
  product_type: {
    name: string;
    is_active: boolean;
    description: string;
  };
  billing_type: {
    name: string;
    label: string;
    is_active: boolean;
    description: string;
  };
  discounted_price: {
    product_id: string;
    discount: number;
    final_price: number;
    price: number;
    quantity: number;
  };
  teethProducts: {
    tooth_number: number[];
  };
};

type ProductArray = Product[];

export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  clientId?: string;
  clientName?: string;
  patient?: string;
  lab_notes?: string;
  client?: {
    client_name: string;
  };
  clientAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  date?: string;
  dueDate?: string;
  case?: Case;
  invoice_notes?: string;
  items: InvoiceItem[];
  subTotal?: number;
  discount?: {
    type: "percentage" | "fixed";
    value: number;
    amount?: number;
  };
  tax?: {
    value: number;
    amount: number;
  };
  totalAmount?: number;
  amount?: number;
  balance?: number;
  status?:
    | "draft"
    | "unpaid"
    | "pending"
    | "approved"
    | "paid"
    | "overdue"
    | "partially_paid"
    | "cancelled";
  paymentTerms?: string;
  notes?: {
    labNotes: string;
    invoiceNotes: string;
  };
  createdAt?: string;
  updatedAt?: string;
  // new types
  received_date?: string;
  case_number?: string;
  products?: ProductArray;
  due_date?: string;
  caseId?: string;
  invoicesData?: {
    status: string;
    amount: number;
    due_date: string;
    lab_id: string;
    case_id: string;
    client_id: string;
  }[];
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
      client: {
        client_name: client.clientName as string,
      },
      clientAddress: client.address,
      date: format(
        addDays(today, -Math.floor(Math.random() * 30)),
        "yyyy-MM-dd"
      ),
      dueDate: format(
        addDays(today, Math.floor(Math.random() * 30)),
        "yyyy-MM-dd"
      ),
      case: {
        id: `case-${i}`,
        caseId: `CASE-${String(i).padStart(4, "0")}`,
        clientId: client.id,
        clientName: client.clientName,
        caseType: "Crown",
        caseStatus: "completed",
        startDate: format(
          addDays(today, -Math.floor(Math.random() * 30)),
          "yyyy-MM-dd"
        ),
        dueDate: format(
          addDays(today, Math.floor(Math.random() * 30)),
          "yyyy-MM-dd"
        ),
        deliveryMethod: "Pickup",
        stages: [
          { name: "Impression", status: "completed" },
          { name: "Modeling", status: "completed" },
          { name: "Finishing", status: "completed" },
        ],
      },
      items: [
        {
          id: `item-${i}-1`,
          description: "Dental Service",
          quantity: 1,
          unitPrice: amount,
          totalPrice: amount,
          discount: 0,
          toothNumber: "",
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
        "approved",
        "paid",
        "overdue",
        "cancelled",
        "partially_paid",
      ][Math.floor(Math.random() * 6)] as
        | "draft"
        | "approved"
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
      (invoice.status === "pending" &&
        new Date(invoice.dueDate as string) < today)
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

export const getStatusColor = (status: Invoice["status"]) => {
  switch (status) {
    case "draft":
      return "bg-gray-500";
    case "approved":
      return "bg-blue-500";
    case "paid":
      return "bg-green-500";
    case "overdue":
      return "bg-red-500";
    case "partially_paid":
      return "bg-orange-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};
