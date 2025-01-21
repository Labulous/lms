import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/formatedDate";
import { PAPER_SIZES } from "./PrintHandler";
import staticLabLogo from "@/assets/staticLabLogo.png";
import { ExtendedCase } from "../CaseDetails";
import ToothSelector from "../wizard/modals/ToothSelector";
import { cn } from "@/lib/utils";

// Define teeth data for rendering
const teethData = [
  // Upper Right (11-18)
  {
    number: 11,
    path: "M164.01,15.85c4.53,0.15,10.17,2.75,12.78,6.3c3.03,4.13,1.28,9.04-2.42,10.69c-3.89,1.73-16.62,13.27-20.44,5.58c-2.02-4.07,1.88-15.5-3.34-18.55c-0.68-1.43-1.55-2.84-3.23-3.5C161.52,15.97,162.72,15.81,164.01,15.85z",
    x: 165,
    y: 30,
  },
  {
    number: 12,
    path: "M104.04,15.85c-4.53,0.15-10.17,2.75-12.78,6.3c-3.03,4.13-1.28,9.04,2.42,10.69c3.89,1.73,16.62,13.27,20.44,5.58c2.02-4.07-1.88-15.5,3.34-18.55c0.68-1.43,1.55-2.84,3.23-3.5C106.54,15.97,105.33,15.81,104.04,15.85z",
    x: 102,
    y: 30,
  },
  {
    number: 13,
    path: "M90.09,30.89c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C101.28,42.73,95.46,34.7,90.09,30.89z",
    x: 84,
    y: 43,
  },
  {
    number: 14,
    path: "M73.97,45.93c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C85.17,57.77,79.35,49.73,73.97,45.93z",
    x: 68,
    y: 58,
  },
  {
    number: 15,
    path: "M63.54,65.56c-2.52-1.09-5.26-1.98-8-1.63c-10.43,1.33-11.03,18.06-2.55,22.02c4.37,2.04,11.87,3.86,16.13,0.47c5.6-4.45,3.43-14.58,1.69-18.45L63.54,65.56z",
    x: 59,
    y: 79,
  },
  {
    number: 16,
    path: "M60.3,109.83c0.07-0.05,0.14-0.11,0.2-0.17c4.02-3.51,6.25-9.72,4.7-14.93c-1.32-4.43-5.57-6.45-9.76-7.35c-5.31-1.14-10.59-0.06-13.35,5.07c-1.42,2.64-2.8,5.79-2.53,8.91c0.33,3.72,3.5,6.05,6.77,7.15c3.07,1.03,6.47,1.57,9.63,2.25C57.54,111.1,59.03,110.83,60.3,109.83z",
    x: 52,
    y: 102,
  },
  // Upper Left (21-28)
  {
    number: 21,
    path: "M164.01,15.85c4.53,0.15,10.17,2.75,12.78,6.3c3.03,4.13,1.28,9.04-2.42,10.69c-3.89,1.73-16.62,13.27-20.44,5.58c-2.02-4.07,1.88-15.5-3.34-18.55c-0.68-1.43-1.55-2.84-3.23-3.5C161.52,15.97,162.72,15.81,164.01,15.85z",
    x: 165,
    y: 30,
  },
  {
    number: 22,
    path: "M177.96,30.89c3.04-2.15,6.49-3.39,9.6-2.95c3.11,0.43,5.61,2.76,7.01,5.4c1.91,3.59,2.09,8.06,0.07,11.6c-1.93,3.39-5.62,5.62-9.47,6.9c-2.48,0.82-5.14,1.3-7.74,0.94c-2.6-0.36-5.13-1.64-6.51-3.73C166.77,42.73,172.59,34.7,177.96,30.89z",
    x: 184,
    y: 43,
  },
  // Lower teeth data
  {
    number: 41,
    path: "M164.01,305.85c4.53-0.15,10.17-2.75,12.78-6.3c3.03-4.13,1.28-9.04-2.42-10.69c-3.89-1.73-16.62-13.27-20.44-5.58c-2.02,4.07,1.88,15.5-3.34,18.55c-0.68,1.43-1.55,2.84-3.23,3.5C161.52,305.73,162.72,305.89,164.01,305.85z",
    x: 165,
    y: 290,
  },
  {
    number: 42,
    path: "M177.96,290.81c3.04,2.15,6.49,3.39,9.6,2.95c3.11-0.43,5.61-2.76,7.01-5.4c1.91-3.59,2.09-8.06,0.07-11.6c-1.93-3.39-5.62-5.62-9.47-6.9c-2.48-0.82-5.14-1.3-7.74-0.94c-2.6,0.36-5.13,1.64-6.51,3.73C166.77,278.97,172.59,286.99,177.96,290.81z",
    x: 184,
    y: 277,
  },
  {
    number: 31,
    path: "M104.04,305.85c-4.53-0.15-10.17-2.75-12.78-6.3c-3.03-4.13-1.28-9.04,2.42-10.69c3.89-1.73,16.62-13.27,20.44-5.58c2.02,4.07-1.88,15.5,3.34,18.55c0.68,1.43,1.55,2.84,3.23,3.5C106.54,305.73,105.33,305.89,104.04,305.85z",
    x: 102,
    y: 290,
  },
  {
    number: 32,
    path: "M90.09,290.81c-3.04,2.15-6.49,3.39-9.6,2.95c-3.11-0.43-5.61-2.76-7.01-5.4c-1.91-3.59-2.09-8.06-0.07-11.6c1.93-3.39,5.62-5.62,9.47-6.9c2.48-0.82,5.14-1.3,7.74-0.94c2.6,0.36,5.13,1.64,6.51,3.73C101.28,278.97,95.46,286.99,90.09,290.81z",
    x: 84,
    y: 277,
  }
];

interface TeethProduct {
  tooth_number: number[];
  product_type?: string;
  material?: string;
  tooth_notes?: string;
  body_shade?: { name: string };
  gingival_shade?: { name: string };
  occlusal_shade?: { name: string };
  stump_shade_id?: { name: string };
}

interface PrintTemplateProps {
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
    teethProduct?: TeethProduct[];
    custom_occlusal_details?: string;
    pontic_type?: string;
    contact_type?: string;
    instruction_notes?: string;
  };
  caseDetails?: ExtendedCase[];
  paperSize: keyof typeof PAPER_SIZES;
  ref?: any;
}

// Helper function to get QR code size based on paper size
const getQRCodeSize = (
  paperSize: keyof typeof PAPER_SIZES,
  type: "large" | "medium" | "small"
) => {
  const sizes = {
    LETTER: { large: 120, medium: 80, small: 40 },
    LEGAL: { large: 140, medium: 100, small: 50 },
    HALF: { large: 100, medium: 70, small: 35 },
  };
  return sizes[paperSize][type];
};

export const QRCodeTemplate: React.FC<PrintTemplateProps> = ({
  caseData,
  paperSize,
}) => (
  <div className="p-2 flex items-start">
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <QRCodeSVG
          value={
            caseData.qr_code || `https://app.labulous.com/cases/${caseData.id}`
          }
          size={getQRCodeSize(paperSize, "large")}
          level="H"
          includeMargin={false}
        />
        <div className="text-center mt-1 text-xs font-mono">
          {caseData.case_number}
        </div>
      </div>
      <div className="flex flex-col text-base">
        <div className="font-bold">
          {caseData.client?.client_name || "No Client"}
        </div>
        <div>{caseData.patient_name}</div>
        <div>{formatDate(caseData.created_at)}</div>
        <div>{caseData.tag?.name || "No Tag"}</div>
      </div>
    </div>
  </div>
);

export const LabSlipTemplate: React.FC<PrintTemplateProps> = ({
  caseData: caseDetail,
  caseDetails,
  paperSize,
}) => {
  const selectedTeeth = caseDetail.teethProduct?.map(tp => tp.tooth_number).flat() || [];

  // Add ArchSelector components
  const UpperArchSelector: React.FC<{
    selectedTeeth: number[];
  }> = ({ selectedTeeth }) => {
    return (
      <div className="relative w-full">
        <svg viewBox="20 0 228 120" className="w-full" preserveAspectRatio="xMidYMid meet">
          {teethData
            .filter(tooth => (tooth.number >= 11 && tooth.number <= 18) || (tooth.number >= 21 && tooth.number <= 28))
            .map((tooth) => (
              <g key={`upper-${tooth.number}`}>
                <path
                  d={tooth.path}
                  className={cn(
                    "transition-colors",
                    selectedTeeth.includes(tooth.number) ? "fill-blue-500" : "fill-gray-200"
                  )}
                />
                <text
                  x={tooth.x}
                  y={tooth.y}
                  className={cn(
                    "text-[8px] pointer-events-none select-none",
                    selectedTeeth.includes(tooth.number) ? "fill-white" : "fill-current"
                  )}
                >
                  {tooth.number}
                </text>
              </g>
            ))}
        </svg>
      </div>
    );
  };

  const LowerArchSelector: React.FC<{
    selectedTeeth: number[];
  }> = ({ selectedTeeth }) => {
    return (
      <div className="relative w-full">
        <svg viewBox="20 240 228 120" className="w-full" preserveAspectRatio="xMidYMid meet">
          {teethData
            .filter(tooth => (tooth.number >= 31 && tooth.number <= 38) || (tooth.number >= 41 && tooth.number <= 48))
            .map((tooth) => (
              <g key={`lower-${tooth.number}`}>
                <path
                  d={tooth.path}
                  className={cn(
                    "transition-colors",
                    selectedTeeth.includes(tooth.number) ? "fill-blue-500" : "fill-gray-200"
                  )}
                />
                <text
                  x={tooth.x}
                  y={tooth.y}
                  className={cn(
                    "text-[8px] pointer-events-none select-none",
                    selectedTeeth.includes(tooth.number) ? "fill-white" : "fill-current"
                  )}
                >
                  {tooth.number}
                </text>
              </g>
            ))}
        </svg>
      </div>
    );
  };

  // Update SplitToothSelector to use the new arch components
  const SplitToothSelector: React.FC<{
    selectedTeeth: number[];
  }> = ({ selectedTeeth }) => {
    // Helper function to filter teeth by arch
    const filterTeethByArch = (teeth: number[], isUpper: boolean) => {
      return teeth.filter(tooth => 
        isUpper ? (tooth >= 11 && tooth <= 18) || (tooth >= 21 && tooth <= 28)
                : (tooth >= 31 && tooth <= 38) || (tooth >= 41 && tooth <= 48)
      );
    };

    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Upper Arch */}
        <div className="border rounded-lg p-2">
          <div className="text-sm font-medium mb-1 text-center">Upper Arch</div>
          <div className="h-[120px]">
            <UpperArchSelector selectedTeeth={filterTeethByArch(selectedTeeth, true)} />
          </div>
        </div>

        {/* Lower Arch */}
        <div className="border rounded-lg p-2">
          <div className="text-sm font-medium mb-1 text-center">Lower Arch</div>
          <div className="h-[120px]">
            <LowerArchSelector selectedTeeth={filterTeethByArch(selectedTeeth, false)} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full p-4" style={{ width: "5.37in", height: "8.77in" }}>
      {/* Header Section */}
      <div className="border-b pb-2 mb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <img src={staticLabLogo} alt="Lab Logo" className="h-10 mb-2" />
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div>
                <span className="font-semibold">Order: </span>
                {caseDetail.case_number}
              </div>
              <div>
                <span className="font-semibold">Patient: </span>
                {caseDetail.patient_name}
              </div>
              <div>
                <span className="font-semibold">Doctor: </span>
                {caseDetail.doctor?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Clinic: </span>
                {caseDetail.client?.client_name || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Scan Date: </span>
                {formatDate(caseDetail.created_at)}
              </div>
              <div>
                <span className="font-semibold">Due Date: </span>
                {caseDetail.due_date ? formatDate(caseDetail.due_date) : "N/A"}
              </div>
              <div>
                <span className="font-semibold">Status: </span>
                {caseDetail.tag?.name || "N/A"}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <QRCodeSVG
              value={caseDetail.qr_code || `https://app.labulous.com/cases/${caseDetail.id}`}
              size={getQRCodeSize(paperSize, "small")}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>
      </div>

      {/* Tooth Diagram Section */}
      <div className="mb-2 border rounded-lg p-2">
        <h2 className="text-lg font-semibold mb-1">Tooth Diagram</h2>
        <SplitToothSelector selectedTeeth={selectedTeeth} />
      </div>

      {/* Product Information Section */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold mb-1">Product Information</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">Tooth #</th>
              <th className="border p-2 text-left">Product</th>
              <th className="border p-2 text-left">Material</th>
              <th className="border p-2 text-left">Shade</th>
              <th className="border p-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {caseDetail.teethProduct?.map((product, index) => (
              <tr key={index}>
                <td className="border p-2">{product.tooth_number.join(", ")}</td>
                <td className="border p-2">{product.product_type || "N/A"}</td>
                <td className="border p-2">{product.material || "N/A"}</td>
                <td className="border p-2">
                  {product.body_shade?.name && `Body: ${product.body_shade.name}`}
                  {product.gingival_shade?.name && `, Gingival: ${product.gingival_shade.name}`}
                  {product.occlusal_shade?.name && `, Occlusal: ${product.occlusal_shade.name}`}
                </td>
                <td className="border p-2">{product.tooth_notes || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Custom Case Details */}
        <div className="mt-2 space-y-1 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Occlusal Type: </span>
              {caseDetail.custom_occlusal_details || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Pontic Type: </span>
              {caseDetail.pontic_type || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Contact Type: </span>
              {caseDetail.contact_type || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-auto">
        <h2 className="text-lg font-semibold mb-1">Instructions</h2>
        <div className="border rounded p-2 text-sm min-h-[80px] whitespace-pre-wrap">
          {caseDetail.instruction_notes || "No special instructions"}
        </div>
      </div>
    </div>
  );
};

export const InvoiceTemplate: React.FC<PrintTemplateProps> = ({
  caseDetails,
}) => (
  <div>
    {caseDetails?.map((invoice, index) => {
      return (
        <div
          key={index}
          className="min-h-[277mm] w-[180mm] mx-auto bg-white"
          style={{
            height: "277mm", // Fixed height to match LETTER page size
          }}
        >
          <div className="py-2">
            <div className="border border-gray-800">
              <div className="p-6">
                {/* Header Section */}
                <div className="flex justify-between mb-8">
                  {/* Company Info */}
                  <div className="flex flex-col gap-0 items-start">
                    <img
                      src={staticLabLogo}
                      alt="Solaris Dental Design Logo"
                      width={120}
                      height={120}
                      className="object-contain flex justify-center items-center"
                    />
                    <div className="text-sm font-medium">
                      <h3 className="font-bold mb-1 text-xl">
                        {invoice.labDetail?.name}
                      </h3>
                      <p>{invoice.labDetail?.office_address.address_1}</p>
                      <p>{invoice.labDetail?.office_address.address_2}</p>
                      <p>
                        <span>{invoice.labDetail?.office_address.city}</span>,{" "}
                        {invoice.labDetail?.office_address.state_province}{" "}
                        <span>
                          {invoice.labDetail?.office_address.zip_postal}
                        </span>
                      </p>
                      <p>{invoice.labDetail?.office_address.phone_number}</p>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="text-sm">
                    <h1 className="text-xl font-bold mb-2">INVOICE</h1>
                    <p className="font-bold">
                      <p className="text-gray-600">
                        Inv #:{" "}
                        {invoice.case_number
                          ? invoice.case_number.split("-")[2]
                          : "N/A"}
                      </p>
                    </p>
                    <p className="font-bold">
                      {formatDate(invoice?.created_at || "1/7/2025")}
                    </p>
                    <div className="mt-4 font-medium">
                      <p className="font-bold">Ship To:</p>
                      <p>{invoice.client.street}</p>
                      <p>
                        {invoice.client.city}
                        {", "}
                        <span>{invoice.client.state}</span>
                      </p>
                      <p>{invoice.client.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Section */}
                <div className="mb-6">
                  <p className="font-medium">
                    <span className="font-bold">Patient:</span>{" "}
                    {invoice?.patient_name}
                  </p>
                </div>

                {/* Services Table */}
                <div className="mb-8">
                  <div className="grid grid-cols-4 border-b border-gray-800 pb-2 mb-4">
                    <h2 className="font-bold">Description</h2>
                    <h2 className="font-bold text-right">Dicount %</h2>
                    <h2 className="font-bold text-right">Amount</h2>
                    <h2 className="font-bold text-right">Final Amount</h2>
                  </div>

                  {invoice?.products.map((item, index) => {
                    return (
                      <div className="grid grid-cols-4 text-sm">
                        <div key={index} className="space-y-4 font-medium">
                          <div>
                            <p>{item.name}</p>
                            <p className="text-sm">
                              Teeth: #{item.teethProduct?.tooth_number[0]}
                            </p>
                          </div>
                        </div>
                        <p className="text-right">
                          {item.discounted_price.discount}%
                        </p>
                        <p className="text-right">
                          ${item.discounted_price.price}
                        </p>
                        <p className="text-right">
                          ${item.discounted_price.final_price}
                        </p>
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-800">
                    <p className="text-sm">J4</p>
                    <div className="flex flex-col gap-2 items-end">
                      <p className="font-bold">
                        Total: ${invoice?.invoice?.[0]?.amount}
                      </p>
                      <p className="font-bold">
                        Total Due: ${invoice?.invoice?.[0]?.due_amount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}

                <div className="text-center mt-4 font-medium">
                  <p className="text-sm">Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export const AddressLabelTemplate: React.FC<PrintTemplateProps> = ({
  caseData,
  paperSize,
}) => (
  <div className="h-full flex items-center justify-center p-4">
    <div className="border border-gray-300 p-6 rounded-lg w-full max-w-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xl font-bold mb-1">
            {caseData.client?.client_name}
          </p>
          <p className="text-lg mb-2">{caseData.client?.phone}</p>
          <p className="text-lg mb-1">Case #: {caseData.case_number}</p>
          <p className="text-lg">Patient: {caseData.patient_name}</p>
        </div>
        <div>
          <QRCodeSVG
            value={
              caseData.qr_code ||
              `https://app.labulous.com/cases/${caseData.id}`
            }
            size={getQRCodeSize(paperSize, "small")}
            level="H"
            includeMargin={true}
          />
        </div>
      </div>
    </div>
  </div>
);

export const PatientLabelTemplate: React.FC<PrintTemplateProps> = ({
  caseData,
  paperSize,
}) => (
  <div className="h-full flex items-center justify-center p-4">
    <div className="border border-gray-300 p-6 rounded-lg text-center w-full max-w-sm">
      <h2 className="text-2xl font-bold mb-2">{caseData.patient_name}</h2>
      <p className="text-xl mb-4">Case #: {caseData.case_number}</p>
      <div className="flex justify-center mb-2">
        <QRCodeSVG
          value={
            caseData.qr_code || `https://app.labulous.com/cases/${caseData.id}`
          }
          size={getQRCodeSize(paperSize, "medium")}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  </div>
);
