import React from "react";
import { generateInvoice } from "../../services/invoiceService";
import { InvoiceItem } from "../../data/mockInvoiceData";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface InvoicePreviewProps {
  clientId: string;
  items: InvoiceItem[];
  discount: number;
  discountType: "percentage" | "fixed";
  tax: number;
  notes?: string;
  onClose: () => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  clientId,
  items,
  discount,
  discountType,
  tax,
  notes,
  onClose,
}) => {
  const invoice = generateInvoice(
    clientId,
    items,
    discount,
    discountType,
    tax,
    notes
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div id="invoice-preview" className="p-6 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
            <div className="mt-4">
              <p>
                <strong>Invoice #:</strong> {invoice.invoiceId}
              </p>
              <p>
                <strong>Date:</strong> {invoice.date}
              </p>
              <p>
                <strong>Due Date:</strong> {invoice.dueDate}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Bill To:</h2>
            <p>{invoice.clientName}</p>
          </div>

          <table className="min-w-full mb-8">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.description}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right py-2">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${invoice.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Discount:</span>
                <span>
                  {discountType === "percentage"
                    ? `${discount}%`
                    : `$${discount}`}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax ({tax}%):</span>
                <span>
                  $
                  {(
                    invoice.totalAmount -
                    (invoice.subTotal -
                      (discountType === "percentage"
                        ? (invoice.subTotal * discount) / 100
                        : discount))
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="mb-8">
              <h3 className="font-bold mb-2">Notes:</h3>
              <p className="text-gray-600">{notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
