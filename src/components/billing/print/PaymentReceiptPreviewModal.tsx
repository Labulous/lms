import React, { useState, useEffect, useRef } from "react";
import { X, Download, Printer } from "lucide-react";
import { generateInvoice } from "../../../services/invoiceService";
import { Invoice } from "../../../data/mockInvoiceData";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  InvoiceTemplate,
  LabSlipTemplate,
  PaymentReceiptTemplate,
} from "../../cases/print/PrintTemplates";
import { ExtendedCase } from "../../cases/CaseDetails";
import { PAPER_SIZES } from "../../cases/print/PrintHandler";
import { name } from "ejs";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: any;
  caseDetails: any;
  labData: any;
}

const PaymentReceiptPreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  formData,
  caseDetails,
  labData,
}) => {


  console.log('payment data....................', caseDetails)

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] =
    useState<keyof typeof PAPER_SIZES>("LETTER");

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, formData]);
  console.log(caseDetails, "caseDetails");
  const generatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // Destructure formData to get the required parameters
      const { clientId, items, discount, discountType, tax, notes } = formData;

      // Call generateInvoice with the appropriate arguments
      const result = await generateInvoice(
        clientId,
        items,
        discount,
        discountType,
        tax,
        notes
      );

      // Assuming result has invoiceId instead of invoice
      if ("errors" in result) {
        setError("Invalid invoice data");
        return;
      }

      // Set the invoice data, here we assume `invoiceId` is part of the result
      setInvoice(result as Invoice); // Or replace `invoiceId` with the correct property if needed
    } catch (err) {
      setError("Failed to generate invoice preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("invoiceRef.current after mount:", invoiceRef.current);
  }, []);
  const handlePrint = (type: string) => {

    // Create the preview URL with state encoded in base64
    const previewState = {
      type,
      paperSize: selectedPaperSize,
      caseData: labData,
      caseDetails: caseDetails,
    };

    const stateParam = encodeURIComponent(btoa(JSON.stringify(previewState)));
    const previewUrl = `${window.location.origin}/print-preview?state=${stateParam}`;
    console.log("printingu", previewUrl)
    window.open(previewUrl, "_blank");
  };

  // const handleDownloadPDF = async () => {
  //   debugger;
  //   if (!invoiceRef.current) {
  //     console.log("Invoice reference is missing");
  //     return;
  //   }

  //   setIsDownloading(true);
  //   setError(null);

  //   try {
  //     // Capture the screenshot of the invoice as a canvas with higher resolution
  //     const canvas = await html2canvas(invoiceRef.current, {
  //       scale: 4, // Increase scale for better quality
  //       logging: false,
  //       useCORS: true,
  //     });

  //     console.log("Canvas created successfully");

  //     // Calculate PDF dimensions
  //     const imgData = canvas.toDataURL("image/png");
  //     const imgWidth = 210; // A4 width in mm
  //     const pageHeight = 297; // A4 height in mm
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //     // Create a new PDF
  //     const pdf = new jsPDF("p", "mm", "a4");

  //     // Calculate the number of pages
  //     const pageCount = Math.ceil(imgHeight / pageHeight);

  //     // Add image to the PDF, potentially across multiple pages
  //     for (let i = 0; i < pageCount; i++) {
  //       if (i > 0) {
  //         pdf.addPage();
  //       }

  //       const position = -i * pageHeight; // Shift position for each page
  //       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  //     }

  //     // Save the PDF
  //     pdf.save(`PaymentReceipt-${caseDetails[0]?.statement_number || "unknown"}.pdf`);

  //     console.log("PDF downloaded successfully");
  //   } catch (err) {
  //     console.error("Error generating PDF:", err);
  //     setError("Failed to generate PDF");
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // };


  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      console.log("Invoice reference is missing");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 4,
        logging: false,
        useCORS: true,
      });

      console.log("Canvas created successfully");

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");

      const scaledHeight = Math.min(imgHeight, pageHeight - 20);

      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, scaledHeight);

      pdf.save(`PaymentReceipt-${caseDetails[0]?.id || "undefined"}.pdf`);

      console.log("PDF downloaded successfully");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };



  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Receipt
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadPDF()}
                  disabled={isDownloading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download PDF"}
                </button>
                <button
                  onClick={() => handlePrint("payment_receipt")}
                  disabled={isPrinting}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? "Printing..." : "Print"}
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
          <div ref={invoiceRef}>
            {/* <InvoiceTemplate
              paperSize={selectedPaperSize}
              caseDetails={caseDetails}
              ref={invoiceRef}
            /> */}
            <PaymentReceiptTemplate
              caseDetails={caseDetails}
              labData={labData}
              paperSize="LETTER"
            />
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

export default PaymentReceiptPreviewModal;
