import { format } from "date-fns";
import { Client } from "./mockClientsData";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber?: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subTotal: number;
  discount: { type: "percentage" | "fixed"; value: number; amount: number };
  discountType: "percentage" | "fixed";
  tax: { type: "percentage" | "fixed"; value: number; amount: number };
  totalAmount: number;
  status: "Pending" | "Paid" | "Overdue";
  notes?: string;
  client?: Client;
  paymentTerms: string;
}

export const mockInvoices: Invoice[] = [
  {
    invoiceId: "INV-2024-001",
    clientId: "1",
    clientName: "Smile Dental Clinic",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd"
    ),
    items: [
      {
        id: "1",
        description: "Full Upper Arch Restoration",
        quantity: 1,
        unitPrice: 1200.0,
        totalPrice: 1200.0,
      },
      {
        id: "2",
        description: "Custom Shading",
        quantity: 1,
        unitPrice: 150.0,
        totalPrice: 150.0,
      },
    ],
    subTotal: 1350.0,
    discount: {
      type: "percentage",
      value: 2,
      amount: 10,
    },
    discountType: "percentage",
    tax: {
      type: "percentage",
      value: 2,
      amount: 10,
    },
    totalAmount: 1275.75,
    status: "Pending",
    paymentTerms: "",
  },
];
