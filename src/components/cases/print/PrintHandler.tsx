import React, { useRef } from "react";
import { generatePDF } from "@/lib/generatePdf";
import {
  QRCodeTemplate,
  LabSlipTemplate,
  AddressLabelTemplate,
  PatientLabelTemplate,
  SelectedOrderTemplate,
} from "./PrintTemplates";

// Paper sizes in points (1 inch = 72 points)
export const PAPER_SIZES = {
  LETTER: { width: 612, height: 792 }, // 8.5 x 11 inches
  LEGAL: { width: 612, height: 1008 }, // 8.5 x 14 inches
  HALF: { width: 396, height: 612 }, // 5.5 x 8.5 inches
} as const;

interface PrintHandlerProps {
  type: "qr-code" | "lab-slip" | "address-label" | "patient-label" | "selected-order";
  paperSize?: keyof typeof PAPER_SIZES;
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
  };
  onComplete?: () => void;
}

const PrintHandler: React.FC<PrintHandlerProps> = ({
  type,
  paperSize = "LETTER",
  caseData,
  onComplete,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!printRef.current) return;

    try {
      // Get paper dimensions
      const { width, height } = PAPER_SIZES[paperSize];

      await generatePDF(
        printRef.current.id,
        `${type}-${caseData.case_number}.pdf`,
        {
          format: [width, height],
          orientation: type === "lab-slip" ? "portrait" : "portrait",
        }
      );
      onComplete?.();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  React.useEffect(() => {
    handlePrint();
  }, []);

  // Set container style based on paper size
  const containerStyle = {
    width: `${PAPER_SIZES[paperSize].width / 72}in`,
    height: `${PAPER_SIZES[paperSize].height / 72}in`,
    margin: "0 auto",
    backgroundColor: "white",
  };

  const renderTemplate = () => {
    const props = {
      caseData,
      paperSize,
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
      case "selected-order":
        return <SelectedOrderTemplate caseDetails={undefined} {...props} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={printRef}
      id={`print-${type}`}
      style={containerStyle}
      className="print-container overflow-hidden"
    >
      {renderTemplate()}
    </div>
  );
};

export default PrintHandler;
