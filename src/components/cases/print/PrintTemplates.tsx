import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/formatedDate";
import { PAPER_SIZES } from "./PrintHandler";
import staticLabLogo from "@/assets/staticLabLogo.png";
import { ExtendedCase } from "../CaseDetails";
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
  caseData,
  paperSize,
}) => (
  <div className="h-full p-8">
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lab Slip</h1>
          <p className="text-gray-600">Case #: {caseData.case_number}</p>

          <p className="text-gray-600">
            Date: {formatDate(caseData.created_at)}
          </p>
        </div>
        <div>
          <QRCodeSVG
            value={
              caseData.qr_code ||
              `https://app.labulous.com/cases/${caseData.id}`
            }
            size={getQRCodeSize(paperSize, "medium")}
            level="H"
            includeMargin={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-bold mb-3">Patient Information</h2>
          <p className="text-lg">{caseData.patient_name}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-3">Doctor Information</h2>
          <p className="text-lg">{caseData.doctor?.name || "N/A"}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-3">Lab Details</h2>
        <p className="text-lg">
          Due Date:{" "}
          {caseData.due_date ? formatDate(caseData.due_date) : "Not specified"}
        </p>
      </div>
    </div>
  </div>
);
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
