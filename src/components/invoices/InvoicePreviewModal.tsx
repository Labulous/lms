import React, { useRef } from "react";
import { X, Download, Printer } from "lucide-react";
import { Invoice } from "../../services/invoiceService";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { formatCurrency } from "../../utils/formatters";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  const handleDownload = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div ref={invoiceRef} className="space-y-6 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">Invoice #{invoice.id.slice(0, 8)}</h3>
              <p className="text-gray-600">
                Created: {format(new Date(invoice.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">
                Due Date: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
              </p>
              <p className={`font-semibold ${
                invoice.status === "paid"
                  ? "text-green-600"
                  : invoice.status === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}>
                {invoice.status.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="border-t border-b py-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(invoice.amount)}</p>
              </div>
              <div>
                <p className="text-gray-600">Due Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(invoice.due_amount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6 border-t pt-4">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            <Printer className="mr-2" size={20} />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Download className="mr-2" size={20} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
