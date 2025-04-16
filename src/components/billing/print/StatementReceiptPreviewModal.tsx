import React, { useState, useEffect, useRef } from "react";
import { X, Download, Printer, MailIcon } from "lucide-react";
import { generateInvoice } from "../../../services/invoiceService";
import { Invoice } from "../../../data/mockInvoiceData";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  InvoiceTemplate,
  LabSlipTemplate,
  StatementReceiptTemplate,
} from "../../cases/print/PrintTemplates";
import { ExtendedCase } from "../../cases/CaseDetails";
import { PAPER_SIZES } from "../../cases/print/PrintHandler";
import { name } from "ejs";
import toast from "react-hot-toast";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
const RESEND_API = import.meta.env.VITE_RESEND_API;
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VITE_EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: any;
  caseDetails: any;
  labData: any;
}

const StatementReceiptPreviewModal: React.FC<InvoicePreviewModalProps> = ({
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
  const [isSendingEmail, setIsSendingEmail] = useState(false); // Keep this

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

    const storageKey = "printData";
    localStorage.setItem(storageKey, JSON.stringify(previewState));

    // Build the preview URL with the fixed key in the query string.
    const previewUrl = `${window.location.origin}/print-preview?stateKey=${storageKey}`;


    console.log("printingu", previewUrl)
    window.open(previewUrl, "_blank");
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      console.log("Invoice reference is missing");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Capture the screenshot of the invoice as a canvas with higher resolution
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 4, // Increase scale for better quality
        logging: false,
        useCORS: true,
      });

      console.log("Canvas created successfully");

      // Calculate PDF dimensions
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create a new PDF
      const pdf = new jsPDF("p", "mm", "a4");

      // Add the first page with the image
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // If the image height exceeds the page height, add additional pages
      let totalHeight = imgHeight;
      while (totalHeight > pageHeight) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -totalHeight + pageHeight, imgWidth, imgHeight);
        totalHeight -= pageHeight;
      }

      // Save the PDF
      pdf.save(`StatementReceipt-${caseDetails[0]?.statement.statement_number || "undefined"}.pdf`);

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


  
  const blobToBase64 = async (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(",")[1];
        if (base64String) resolve(base64String);
        else reject("Failed to convert Blob to Base64");
      };
    });
  };

  const handleSendViaEmail = async () => {
    if (!caseDetails || caseDetails.length === 0) {
      toast.error("Cannot send email: Missing data.");
      return;
    }
 
    setIsSendingEmail(true);
    setError(null);
    console.log("caseDetails", caseDetails);
 
    try {
      const attachments: { filename: string; content: string; contentType: string; }[] = [];
      const recipientEmails = [];
 
      const labName = caseDetails[0]?.labData?.name || "Your Lab";
      const labEmail = caseDetails[0]?.labData?.office_address.email || "lab@example.com";
      const labPhone = caseDetails[0]?.labData?.office_address?.phone_number || "(000) 000-0000";
      const currentMonthYear = new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
 
      for (const detail of caseDetails) {
        try {
          if (!detail.client?.email) continue;
          recipientEmails.push(detail.client.email);
 
          const tempContainer = document.createElement("div");
          document.body.appendChild(tempContainer);
          const root = createRoot(tempContainer);
          root.render(
            <StatementReceiptTemplate
              caseDetails={[detail]}
              labData={detail.labData}
              paperSize="LETTER"
            />
          );
          await new Promise(resolve => setTimeout(resolve, 50));
 
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
          });
 
          const pdf = new jsPDF({ compress: true });
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
 
          pdf.addImage(imgData, "image/png", 0, 0, imgWidth, imgHeight);
          const pdfBlob = await new Response(pdf.output("blob")).blob();
          const pdfBase64 = await blobToBase64(pdfBlob);
 
          attachments.push({
            filename: `Statement-${detail.statement?.statement_number || Date.now()}.pdf`,
            content: pdfBase64,
            contentType: "application/pdf",
          });
 
          root.unmount();
          document.body.removeChild(tempContainer);
        } catch (error) {
          console.error(`Failed to process statement:`, error);
        }
      }
 
      if (recipientEmails.length === 0) {
        toast.error("No valid recipients found.");
        return;
      }
 
      const emailSubject = `Monthly Statement – ${labName}`;
      const emailHtml = `
        <p>Dear <strong>${caseDetails[0]?.statement?.client?.client_name || "Client"}</strong>,</p>
        <p>Attached is your monthly statement for <strong>${currentMonthYear}</strong> from <strong>${labName}</strong>, summarizing recent transactions and balances.</p>
        <p>For any discrepancies or inquiries, please reach out to us at <strong><a href="mailto:${labEmail}">${labEmail}</a></strong>.</p>
        <p>Best regards,<br/><br/>
        <strong>${labName}</strong><br/>
        <strong>${labPhone}</strong> | <strong><a href="mailto:${labEmail}">${labEmail}</a></strong></p>
      `;
 
      // Prepare the bulk email data for the Resend function
      const bulkEmails = recipientEmails.map(email => ({
        from: `Statement <statement@${VITE_EMAIL_FROM}>`,
        to: email,
        subject: emailSubject,
        html: emailHtml,
        attachments,
      }));
 
      const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/resend-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ bulkEmails }),
      });
 
      const result = await response.json();
      if (response.ok) {
        toast.success("Emails sent successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Email sending error:", error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  const currentLabData = Array.isArray(labData) ? labData[0] : labData;

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
                Statement Receipt
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
                  onClick={handleSendViaEmail} disabled={isSendingEmail || isDownloading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <MailIcon className="h-4 w-4 mr-2" />
                  {isSendingEmail ? "Sending..." : "Send Email"}
                </button>
                <button
                  onClick={() => handlePrint("statement_receipt")}
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
            <StatementReceiptTemplate
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

export default StatementReceiptPreviewModal;