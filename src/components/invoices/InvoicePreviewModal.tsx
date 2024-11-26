import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { generateInvoice, formatCurrency } from '../../services/invoiceService';
import { Invoice } from '../../data/mockInvoiceData';
import { getClientById } from '../../data/mockClientsData';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  formData,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, formData]);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateInvoice(formData);
      if ('errors' in result) {
        setError('Invalid invoice data');
        return;
      }
      setInvoice(result.invoice);
    } catch (err) {
      setError('Failed to generate invoice preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    onBeforeGetContent: () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
    `,
  });

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading || !invoice}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={isPrinting || !invoice}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print'}
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : invoice ? (
              <div ref={invoiceRef} className="space-y-6 p-6 bg-white">
                {/* Company Logo and Info */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Labulous Dental Lab</h2>
                  <p className="text-gray-600">123 Lab Street, Suite 100</p>
                  <p className="text-gray-600">Lab City, LC 12345</p>
                  <p className="text-gray-600">Phone: (555) 123-4567</p>
                </div>

                {/* Invoice Title and Number */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                  <p className="text-gray-600">#{invoice.invoiceNumber}</p>
                </div>

                {/* Header Information */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Bill To:</h4>
                    <p className="text-gray-800 font-medium">{invoice.clientName}</p>
                    <p className="text-gray-600">{invoice.clientAddress.street}</p>
                    <p className="text-gray-600">
                      {invoice.clientAddress.city}, {invoice.clientAddress.state} {invoice.clientAddress.zipCode}
                    </p>
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Invoice Date:</p>
                        <p className="font-medium">{invoice.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Due Date:</p>
                        <p className="font-medium">{invoice.dueDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-8">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-end space-y-2">
                      <div className="w-64">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-900">{formatCurrency(invoice.subTotal)}</span>
                        </div>
                        {invoice.discount && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">
                              Discount ({invoice.discount.type === 'percentage' ? `${invoice.discount.value}%` : 'Fixed'})
                            </span>
                            <span className="text-gray-900">-{formatCurrency(invoice.discount.amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Tax ({invoice.tax.value}%)</span>
                          <span className="text-gray-900">{formatCurrency(invoice.tax.amount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-200 font-bold">
                          <span>Total</span>
                          <span>{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-8 border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600">{invoice.notes}</p>
                  </div>
                )}

                {/* Payment Terms */}
                <div className="mt-8 text-sm text-gray-600">
                  <p>Payment Terms: {invoice.paymentTerms}</p>
                  <p className="mt-2">Please make checks payable to: Labulous Dental Lab</p>
                </div>

                {/* Thank You Note */}
                <div className="mt-8 text-center text-gray-600">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;