/**
 * Invoice Service
 * Handles invoice generation, calculations, and related utilities
 * for the Labulous application.
 */

import { Invoice, InvoiceItem } from "../data/mockInvoiceData";
import { mockClients } from "../data/mockClientsData";

export const generateInvoiceId = (): string => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `INV-${year}-${sequence}`;
};

export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  discount: number,
  discountType: "percentage" | "fixed",
  tax: number
): { subTotal: number; totalAmount: number } => {
  const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const discountAmount =
    discountType === "percentage" ? (subTotal * discount) / 100 : discount;

  const afterDiscount = subTotal - discountAmount;
  const taxAmount = (afterDiscount * tax) / 100;
  const totalAmount = afterDiscount + taxAmount;

  return {
    subTotal,
    totalAmount,
  };
};

export const generateInvoice = (
  clientId: string,
  items: InvoiceItem[] | [],
  discount: number = 0,
  discountType: "percentage" | "fixed" = "percentage",
  tax: number = 0,
  notes?: string
): Invoice => {
  const client = mockClients.find((c) => c.id === clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const { subTotal, totalAmount } = calculateInvoiceTotals(
    items,
    discount,
    discountType,
    tax
  );
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

  return {
    invoiceId: generateInvoiceId(),
    clientId,
    clientName: client.clientName,
    date: new Date().toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    items,
    subTotal,
    discount: {
      type: "percentage",
      value: 2,
      amount: 2,
    },
    discountType,
    tax: {
      type: "percentage",
      value: 1,
      amount: 1,
    },
    totalAmount,
    status: "pending",
    notes,
    paymentTerms: "",
  };
};
