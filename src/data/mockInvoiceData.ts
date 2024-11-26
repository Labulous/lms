import { format } from 'date-fns';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  invoiceId: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subTotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
}

export const mockInvoices: Invoice[] = [
  {
    invoiceId: 'INV-2024-001',
    clientId: '1',
    clientName: 'Smile Dental Clinic',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [
      {
        id: '1',
        description: 'Full Upper Arch Restoration',
        quantity: 1,
        unitPrice: 1200.00,
        totalPrice: 1200.00
      },
      {
        id: '2',
        description: 'Custom Shading',
        quantity: 1,
        unitPrice: 150.00,
        totalPrice: 150.00
      }
    ],
    subTotal: 1350.00,
    discount: 10,
    discountType: 'percentage',
    tax: 5,
    totalAmount: 1275.75,
    status: 'pending'
  }
];