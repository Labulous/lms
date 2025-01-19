import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  QRCodeTemplate,
  LabSlipTemplate,
  AddressLabelTemplate,
  PatientLabelTemplate,
  InvoiceTemplate,
} from "@/components/cases/print/PrintTemplates";
import { PAPER_SIZES } from "@/components/cases/print/PrintHandler";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import CaseDetails, { ExtendedCase } from "@/components/cases/CaseDetails";

interface PrintPreviewState {
  type:
    | "qr-code"
    | "lab-slip"
    | "address-label"
    | "patient-label"
    | "invoice_slip";
  paperSize: keyof typeof PAPER_SIZES;
  caseData: {
    id: string;
    patient_name: string;
    case_number: string;
    qr_code?: string;
    client?: {
      client_name: string;
      phone: string;
    };
    doctor?: {
      name: string;
    };
    created_at: string;
    due_date?: string;
    tag?: {
      name: string;
    };
  };
  caseDetails?: ExtendedCase[];
}

const PrintPreview = () => {
  const [searchParams] = useSearchParams();
  const [previewState, setPreviewState] = useState<PrintPreviewState | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Get state from URL parameter
      const stateParam = searchParams.get("state");
      if (!stateParam) {
        throw new Error("No state parameter found");
      }

      // Decode and parse state
      const decodedState = JSON.parse(atob(decodeURIComponent(stateParam)));
      setPreviewState(decodedState);
    } catch (error) {
      console.error("Error parsing state:", error);
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  // If no state, show loading or return null
  if (!previewState) {
    return null;
  }

  const { type, paperSize = "LETTER", caseData, caseDetails } = previewState;

  const handlePrint = () => {
    window.print();
  };
  const renderTemplate = () => {
    const props = {
      caseData,
      paperSize,
      caseDetails,
    };
    switch (type) {
      case "qr-code":
        return <QRCodeTemplate {...props} />;
      case "lab-slip":
        return <LabSlipTemplate {...props} />;
      case "address-label":
        return <AddressLabelTemplate {...props} />;
      case "patient-label":
        return <PatientLabelTemplate {...props} />;
      case "invoice_slip":
        return (
          <InvoiceTemplate
            caseData={{
              id: "2323",
              patient_name: "Hussain abbas",
              case_number: "SOL-2025-0025",
              qr_code: "",
              client: {
                client_name: "zahid",
                phone: "zahi",
              },
              doctor: {
                name: "zahid",
              },
              created_at: "11 june",
              due_date: "11 june",
              tag: {
                name: "ffff",
              },
            }}
            paperSize={"LETTER"}
            caseDetails={caseDetails}
          />
        );
      default:
        return <div>Invalid template type</div>;
    }
  };

  // Get paper dimensions with fallback to LETTER size
  const dimensions = PAPER_SIZES[paperSize] || PAPER_SIZES.LETTER;
  const containerStyle = {
    width: `${dimensions.width / 72}in`,
    height: `${dimensions.height / 72}in`,
    margin: "0",
    backgroundColor: "white",
    position: "relative" as const,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Print Preview</h1>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div style={containerStyle} className="print-container">
            {renderTemplate()}
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              size: ${paperSize.toLowerCase()};
              margin: 0mm;  
            }
            body {
              margin: 0;
              padding: 0;
            }

            body * {
              visibility: hidden;
            }

            .print-container, .print-container * {
              visibility: visible;
            }

            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              margin: 0;
              padding: 0;
              width: ${dimensions.width / 72}in;
              height: ${dimensions.height / 72}in;
              max-width: 100%;
              max-height: 100%;
              box-sizing: border-box;
            }
          }

          /* Preview styles */
          .print-container {
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background-color: white;
          }
        `}
      </style>
    </div>
  );
};

export default PrintPreview;
