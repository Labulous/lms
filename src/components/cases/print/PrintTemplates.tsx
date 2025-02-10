import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate, formatDateWithTime } from "@/lib/formatedDate";
import { PAPER_SIZES } from "./PrintHandler";
import staticLabLogo from "@/assets/staticLabLogo.png";
import CaseDetails, { ExtendedCase } from "../CaseDetails";
import { cn } from "@/lib/utils";
import { DefaultProductType } from "@/types/supabase";
import { CheckCircle2, X } from "lucide-react";
import ClientDetails from "@/components/clients/ClientDetails";
import moment from "moment";

const TYPE_COLORS = {
  Crown: "rgb(59 130 246)", // blue-500
  Bridge: "rgb(168 85 247)", // purple-500
  Removable: "rgb(77 124 15)", // lime-700
  Implant: "rgb(6 182 212)", // cyan-500
  Other: "rgb(107 114 128)", // gray-500
  Veneer: "rgb(236 72 153)", // pink-500
  Inlay: "rgb(249 115 22)", // orange-500
  Onlay: "rgb(234 179 8)", // yellow-500
};
const teethData = [
  {
    number: 12,
    path: "M104.04,15.85c-4.53,0.15-10.17,2.75-12.78,6.3c-3.03,4.13-1.28,9.04,2.42,10.69 c3.89,1.73,16.62,13.27,20.44,5.58c5.6-4.45,3.43-14.58,1.69-18.45L104.04,15.85z",
    x: 102,
    y: 30,
  },
  {
    number: 13,
    path: "M90.09,30.89c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6 c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C101.28,42.73,95.46,34.7,90.09,30.89z",
    x: 84,
    y: 43,
  },
  {
    number: 14,
    path: "M73.97,45.93c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6 c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C85.17,57.77,79.35,49.73,73.97,45.93z",
    x: 68,
    y: 58,
  },
  {
    number: 15,
    path: "M63.54,65.56c-2.52-1.09-5.26-1.98-8-1.63c-10.43,1.33-11.03,18.06-2.55,22.02 c4.37,2.04,11.87,3.86,16.13,0.47c5.6-4.45,3.43-14.58,1.69-18.45L63.54,65.56z",
    x: 59,
    y: 79,
  },
  {
    number: 16,
    path: "M60.3,109.83c0.07-0.05,0.14-0.11,0.2-0.17c4.02-3.51,6.25-9.72,4.7-14.93c-1.32-4.43-5.57-6.45-9.76-7.35 c-5.31-1.14-10.59-0.06-13.35,5.07c-1.42,2.64-2.8,5.79-2.53,8.91c0.33,3.72,3.5,6.05,6.77,7.15c3.07,1.03,6.47,1.57,9.63,2.25 C57.54,111.1,59.03,110.83,60.3,109.83z",
    x: 52,
    y: 102,
  },
  {
    number: 17,
    path: "M54.82,111.6c-3.48-0.73-6.76-2.3-10.28-2.86c-2.27-0.36-4.77-0.11-6.53,1.38 c-1.19,1.01-1.91,2.47-2.57,3.89c-0.83,1.79-1.64,3.61-1.99,5.56s-0.2,4.05,0.79,5.75c0.84,1.45,2.23,2.5,3.67,3.33 c2.72,1.56,5.8,2.45,8.92,2.6c4.43,0.21,9.19-1.32,11.78-4.97c3.42-4.82,1.99-13.58-4.51-14.76",
    x: 46,
    y: 123,
  },
  {
    number: 18,
    path: "M47.67,155.5c0.17-0.02,0.33-0.04,0.5-0.06c6.8-0.82,10.92-6.54,9.73-13.69c-0.3-1.78-1.1-3.42-1.9-5.03 c-0.58-1.18-1.22-2.43-2.34-3.11c-0.9-0.55-1.99-0.65-3.03-0.74c-3.45-0.3-6.89-0.61-10.34-0.91c-1.25-0.11-2.54-0.22-3.75,0.11 c-3.91,1.04-6.25,6.27-7.09,9.91c-2.3,9.98,7.01,14.14,15.3,13.79C45.71,155.73,46.69,155.62,47.67,155.5z",
    x: 43,
    y: 145,
  },
  {
    number: 11,
    path: "M129.07,11.36c-4.16-1.81-10.36-1.88-14.2,0.22c-4.47,2.44-4.93,7.64-2.27,10.72 c2.8,3.24,9.53,19.16,16.19,13.83c3.53-2.82,4.76-14.85,4.71-18.24c-0.02-1.58-0.22-3.24-1.47-4.56 C131.28,12.53,130.26,11.87,129.07,11.36z",
    x: 123,
    y: 25,
  },
  {
    number: 21,
    path: "M138.98,11.36c4.16-1.81,10.36-1.88,14.2,0.22c4.47,2.44,4.93,7.64,2.27,10.72 c-2.8,3.24-9.53,19.16-16.19,13.83c-3.53-2.82-4.76-14.85-4.71-18.24c0.02-1.58,0.22-3.24,1.47-4.56 C136.78,12.53,137.8,11.87,138.98,11.36z",
    x: 145,
    y: 25,
  },
  {
    number: 23,
    path: "M177.96,30.89c3.04-2.15,6.49-3.39,9.6-2.95c3.11,0.43,5.61,2.76,7.01,5.4c1.91,3.59,2.09,8.06,0.07,11.6 c-1.93,3.39-5.62,5.62-9.47,6.9c-2.48,0.82-5.14,1.3-7.74,0.94c-2.6-0.36-5.13-1.64-6.51-3.73 C166.77,42.73,172.59,34.7,177.96,30.89z",
    x: 184,
    y: 43,
  },
  {
    number: 24,
    path: "M194.08,45.93c3.04-2.15 6.49-3.39 9.6-2.95c3.11 0.43 5.61 2.76 7.01 5.4c1.91 3.59 2.09 8.06 0.07 11.6 c-1.93 3.39-5.62 5.62-9.47 6.9c-2.48 0.82-5.14 1.3-7.74 0.94c-2.6-0.36-5.13-1.64-6.51-3.73 C182.88 57.77 188.7 49.73 194.08 45.93z",
    x: 200,
    y: 58,
  },
  {
    number: 25,
    path: "M204.51,65.56c2.52-1.09,5.26-1.98,8-1.63c10.43,1.33,11.03,18.06,2.55,22.02 c-4.37,2.04-11.87,3.86-16.13,0.47c-5.6-4.45-3.43-14.58,1.69-18.45L204.51,65.56z",
    x: 209,
    y: 80,
  },
  {
    number: 26,
    path: "M207.76,109.83c-0.07-0.05-0.14-0.11-0.2-0.17c-4.02-3.51-6.25-9.72-4.7-14.93 c1.32-4.43,5.57-6.45,9.76-7.35c5.31-1.14,10.59-0.06,13.35,5.07c1.42,2.64,2.8,5.79,2.53,8.91c-0.33,3.72-3.5,6.05-6.77,7.15 c-3.07,1.03-6.47,1.57-9.63,2.25C210.51,111.1,209.02,110.83,207.76,109.83z",
    x: 216,
    y: 101,
  },
  {
    number: 27,
    path: "M213.24,111.6c3.48-0.73,6.76-2.3,10.28-2.86c2.27-0.36,4.77-0.11,6.53,1.38c1.19,1.01,1.91,2.47,2.57,3.89 c0.83,1.79,1.64,3.61,1.99,5.56c0.35,1.94,0.2,4.05-0.79,5.75c-0.84,1.45-2.23,2.5-3.67,3.33c-2.72,1.56-5.8,2.45-8.92,2.6 c-4.43,0.21-9.19-1.32-11.78-4.97c-3.42-4.82-1.99-13.58,4.51-14.76",
    x: 222,
    y: 123,
  },
  {
    number: 28,
    path: "M220.38,155.5c-0.17-0.02-0.33-0.04-0.5-0.06c-6.8-0.82-10.92-6.54-9.73-13.69c0.3-1.78,1.1-3.42,1.9-5.03 c0.58-1.18,1.22-2.43,2.34-3.11c0.9-0.55,1.99-0.65,3.03-0.74c3.45-0.3,6.89-0.61,10.34-0.91c1.25-0.11,2.54-0.22,3.75,0.11 c3.91,1.04,6.25,6.27,7.09,9.91c2.3,9.98-7.01,14.14-15.3,13.79C222.34,155.73,221.36,155.62,220.38,155.5z",
    x: 225,
    y: 145,
  },
  {
    number: 22,
    path: "M164.01,15.85c4.53,0.15,10.17,2.75,12.78,6.3c3.03,4.13,1.28,9.04-2.42,10.69 c-3.89,1.73-16.62,13.27-20.44,5.58c-2.02-4.07,1.88-15.5,3.34-18.55c0.68-1.43,1.55-2.84,3.23-3.5 C161.52,15.97,162.72,15.81,164.01,15.85z",
    x: 165,
    y: 30,
  },
] as const;

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
  caseData?: {
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
  caseDetails?: ExtendedCase[] | any[];
  paperSize: keyof typeof PAPER_SIZES;
  ref?: any;
}

interface PrintStatementTemplateProps {
  caseDetails: any[] | undefined;
  labData: any;
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
            caseData?.qr_code ||
            `https://app.labulous.com/cases/${caseData?.id}`
          }
          size={getQRCodeSize(paperSize, "large")}
          level="H"
          includeMargin={false}
        />
        <div className="text-center mt-1 text-xs font-mono">
          {caseData?.case_number}
        </div>
      </div>
      <div className="flex flex-col text-base">
        <div className="font-bold">
          {caseData?.client?.client_name || "No Client"}
        </div>
        <div>{caseData?.patient_name}</div>
        <div>{caseData?.created_at && formatDate(caseData?.created_at)}</div>
        <div>{caseData?.tag?.name || "No Tag"}</div>
      </div>
    </div>
  </div>
);

export const InvoiceTemplate: React.FC<PrintTemplateProps> = ({
  caseDetails,
}) => {
  return (
    <div>
      {caseDetails?.map((invoice, index) => {
        const formatTeethRange = (teeth: number[]): string => {
          if (!teeth.length) return "";

          // Define the sequence for upper and lower teeth based on the provided data
          const teethArray = [
            // Upper right to upper left
            18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
            // Lower left to lower right
            38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
          ];

          // Function to group consecutive teeth based on the sequence
          const getConsecutiveGroups = (teeth: number[]): string[] => {
            if (teeth.length === 0) return [];

            // Sort the teeth based on the order in teethArray
            const sortedTeeth = [...teeth].sort(
              (a, b) => teethArray.indexOf(a) - teethArray.indexOf(b)
            );

            let groups: string[] = [];
            let groupStart = sortedTeeth[0];
            let prev = sortedTeeth[0];

            for (let i = 1; i <= sortedTeeth.length; i++) {
              const current = sortedTeeth[i];

              // Check if the current tooth is consecutive to the previous one in the sequence
              if (
                teethArray.indexOf(current) !==
                teethArray.indexOf(prev) + 1
              ) {
                // End of a group
                if (groupStart === prev) {
                  groups.push(`#${groupStart}`);
                } else {
                  groups.push(`#${groupStart}-#${prev}`);
                }
                groupStart = current; // Start a new group
              }
              prev = current;
            }

            return groups;
          };

          // Get consecutive groups of teeth
          const groupedTeeth = getConsecutiveGroups(teeth);

          // If there's only one group, return it
          return groupedTeeth.join(", ");
        };
        console.log(invoice.products, "invoiceproducts");

        function mergeProducts(products: any) {
          const mergedMap = new Map();

          // Iterate through the products array
          products.forEach((product: any) => {
            // Create a key for identifying the product by its properties
            const key = JSON.stringify({
              id: product.id,
              shades: {
                occlusal: product.teethProduct.occlusal_shade,
                body: product.teethProduct.body_shade,
                gingival: product.teethProduct.gingival_shade,
                stump: product.teethProduct.stump_shade,
              },
              service: product.service?.id,
            });

            // Check if this product has already been merged
            if (mergedMap.has(key)) {
              const existingProduct = mergedMap.get(key);

              // Merge the tooth_number array, ensuring no duplicates
              const mergedToothNumbers = [
                ...new Set([
                  ...existingProduct.teethProduct.tooth_number,
                  ...product.teethProduct.tooth_number,
                ]),
              ];
              existingProduct.teethProduct.tooth_number = mergedToothNumbers;

              // Sum up price, final_price, and total for merged products
              if (
                existingProduct.discounted_price &&
                product.discounted_price
              ) {
                existingProduct.discounted_price.price +=
                  product.discounted_price.price;
                existingProduct.discounted_price.final_price +=
                  product.discounted_price.final_price;
                existingProduct.discounted_price.total +=
                  product.discounted_price.total;
              }
            } else {
              // For the first occurrence, create a shallow copy to prevent modifying the original data
              mergedMap.set(key, {
                ...product,
                discounted_price: { ...product.discounted_price },
                teethProduct: { ...product.teethProduct },
              });
            }
          });

          // Return the merged products as a new array (does not affect the original `products` array)
          return Array.from(mergedMap.values());
        }

        const products = mergeProducts(invoice.products);
        console.log(products, "products");
        return (
          <div
            key={index}
            className="min-h-[277mm] w-[180mm] mx-auto bg-white"
            style={{
              height: "277mm", // Fixed height to match LETTER page size
            }}
          >
            <div className="bg-white">
              <div className="mx-auto max-w-xl">
                <div className="p-8">
                  <div className="p-5">
                    <div className="p-0">
                      {/* Header Section */}
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                          {/* Left side - Company Info */}
                          <div className="space-y-4">
                            <div>
                              <img
                                src={staticLabLogo}
                                alt="Solaris Dental Design Logo"
                                width={100}
                                height={100}
                                className="object-contain"
                              />
                            </div>
                            <div
                              className="space-y-0"
                              style={{ lineHeight: "1.1" }}
                            >
                              <p className="font-bold text-sm">
                                {invoice.labDetail?.name}
                              </p>
                              <p className="text-sm">
                                {invoice.labDetail?.office_address.address_1}
                              </p>
                              <p className="text-sm">
                                {invoice.labDetail?.office_address.city},{" "}
                                {
                                  invoice.labDetail?.office_address
                                    .state_province
                                }{" "}
                                <span>
                                  {invoice.labDetail?.office_address.zip_postal}
                                </span>
                              </p>
                              <p className="text-sm">
                                {invoice.labDetail?.office_address.phone_number}
                              </p>
                            </div>
                          </div>

                          {/* Right side - Invoice Details */}
                          <div className="text-right">
                            <h2 className="text-5xl font-bold text-gray-400 mb-8">
                              INVOICE
                            </h2>
                            <div
                              className="space-y-1"
                              style={{ lineHeight: "1.1" }}
                            >
                              <div className="border-b border-gray-300 pb-0.5">
                                <div className="grid grid-cols-[auto_1fr] gap-4">
                                  <p className="text-right font-medium whitespace-nowrap text-sm">
                                    Date:
                                  </p>
                                  <p className="text-right min-w-[120px] text-sm">
                                    {formatDate(
                                      invoice?.received_date || "1/7/2025"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bill To Section */}
                        <div className="mt-8">
                          <div>
                            <p className="font-bold text-sm">Bill To:</p>
                            <div
                              className="space-y-0"
                              style={{ lineHeight: "1.1" }}
                            >
                              <p className="text-sm">
                                {invoice.client.client_name}
                              </p>
                              <p className="text-sm">
                                Dr. {invoice.doctor.name}
                              </p>
                              <p className="text-sm">{invoice.client.street}</p>
                              <p className="text-sm">
                                {invoice.client.city}
                                {", "}
                                <span>{invoice.client.state}</span>
                              </p>
                              <p className="text-sm">{invoice.client.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patient Section */}
                      <div className="mt-4 mb-6">
                        <p className="text-sm">
                          <span className="font-bold">Patient:</span>{" "}
                          <span>{invoice?.patient_name}</span>
                        </p>
                      </div>

                      {/* Services Table */}
                      <div className="mb-8">
                        <div className="grid grid-cols-12 border border-gray-300 bg-gray-100 mb-4 gap-1">
                          <h3
                            className="font-bold col-span-6 text-xs p-2"
                            style={{ lineHeight: "1.15" }}
                          >
                            Description
                          </h3>
                          <h2
                            className="font-bold text-right col-span-1 text-xs p-2"
                            style={{ lineHeight: "1.15" }}
                          >
                            Price
                          </h2>
                          <h2
                            className="font-bold text-right col-span-1 text-xs p-2"
                            style={{ lineHeight: "1.15" }}
                          >
                            DC(%)
                          </h2>
                          <h2
                            className="font-bold text-right col-span-2 text-xs p-2"
                            style={{ lineHeight: "1.15" }}
                          >
                            {" "}
                            Price(%)
                          </h2>
                          <h2
                            className="font-bold text-right col-span-2 text-xs p-2"
                            style={{ lineHeight: "1.15" }}
                          >
                            Sub Total
                          </h2>
                        </div>

                        {products.map((item: any, index: number) => {
                          const serviceRow = item.service ? (
                            <div
                              className={`grid grid-cols-12 text-sm mb-6 pb-2 border-b border-gray-300`}
                              style={{ lineHeight: "1.1" }}
                            >
                              <div className="space-y-1 font-medium col-span-6 pl-2">
                                <div>
                                  <p>{item.service.name}</p>
                                  <p className="font-bold">Service</p>
                                </div>
                              </div>
                              <p
                                className="text-right col-span-1 pr-2 font-bold"
                                style={{ lineHeight: "1.15" }}
                              >
                                ${item.service.price}
                              </p>
                              <p
                                className="text-right col-span-1 pr-2 font-bold"
                                style={{ lineHeight: "1.15" }}
                              >
                                $0
                              </p>
                              <p
                                className="text-right col-span-2 pr-2 font-bold"
                                style={{ lineHeight: "1.15" }}
                              >
                                ${item.service.price?.toLocaleString()}
                              </p>
                              <p
                                className="text-right col-span-2 pr-2 font-bold"
                                style={{ lineHeight: "1.15" }}
                              >
                                ${item.service.price?.toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <></>
                          );

                          return (
                            <React.Fragment key={index}>
                              <div
                                className={`grid grid-cols-12 text-sm mb-6 pb-2 border-b border-gray-300`}
                                style={{ lineHeight: "1.1" }}
                              >
                                <div className="space-y-1 font-medium col-span-6 pl-2">
                                  <div>
                                    <p
                                      className="font-extrabold"
                                      style={{ lineHeight: "1.15" }}
                                    >
                                      {item.name}
                                    </p>
                                    <p
                                      className="text-sm pl-6 font-extrabold"
                                      style={{ lineHeight: "1.15" }}
                                    >
                                      <span className="font-normal">
                                        Teeth:{" "}
                                      </span>
                                      {item.teethProduct.type !== "Bridge"
                                        ? item.teethProduct?.tooth_number
                                            .map((item:number) => item)
                                            .join(",")
                                        : formatTeethRange(
                                            item.teethProduct?.tooth_number
                                          )}
                                    </p>
                                    <p
                                      className="text-sm flex gap-0 flex-wrap pl-6 mt-3"
                                      style={{ lineHeight: "1.15" }}
                                    >
                                      <span className="font-normal">
                                        Shade:&nbsp;
                                      </span>
                                      {/* Occlusal Shade */}
                                      {(item?.teethProduct?.occlusal_shade
                                        ?.name ||
                                        item?.teethProduct
                                          ?.custom_occlusal_shade ||
                                        item?.teethProduct
                                          ?.manual_occlusal_shade) && (
                                        <>
                                          <span>
                                            <span className="font-normal">
                                              Incisal:{" "}
                                            </span>
                                            <span className="font-bold">
                                              {item?.teethProduct
                                                ?.manual_occlusal_shade ||
                                                item?.teethProduct
                                                  ?.occlusal_shade?.name}
                                            </span>
                                            {item?.teethProduct
                                              ?.custom_occlusal_shade && (
                                              <span
                                                className="font-extrabold"
                                                style={{
                                                  color:
                                                    TYPE_COLORS[
                                                      item?.product_type
                                                        ?.name as keyof typeof TYPE_COLORS
                                                    ] || TYPE_COLORS.Other,
                                                }}
                                              >
                                                {
                                                  item?.teethProduct
                                                    ?.custom_occlusal_shade
                                                }{" "}
                                                (custom)
                                              </span>
                                            )}
                                          </span>
                                          {(item?.teethProduct?.body_shade
                                            ?.name ||
                                            item?.teethProduct?.gingival_shade
                                              ?.name ||
                                            item?.teethProduct
                                              ?.stump_shade_id ||
                                            item?.teethProduct
                                              ?.custom_body_shade ||
                                            item?.teethProduct
                                              ?.custom_gingival_shade ||
                                            item?.teethProduct
                                              ?.custom_stump_shade ||
                                            item?.teethProduct
                                              ?.manual_body_shade ||
                                            item?.teethProduct
                                              ?.manual_gingival_shade ||
                                            item?.teethProduct
                                              ?.manual_stump_shade) && (
                                            <span>,</span>
                                          )}
                                        </>
                                      )}

                                      {/* Body Shade */}
                                      {(item?.teethProduct?.body_shade?.name ||
                                        item?.teethProduct?.custom_body_shade ||
                                        item?.teethProduct
                                          ?.manual_body_shade) && (
                                        <>
                                          <span>
                                            <span className="font-normal">
                                              Body:{" "}
                                            </span>
                                            <span className="font-bold">
                                              {item?.teethProduct
                                                ?.manual_body_shade ||
                                                item?.teethProduct?.body_shade
                                                  ?.name}
                                            </span>
                                            {item?.teethProduct
                                              ?.custom_body_shade && (
                                              <span
                                                className="font-extrabold"
                                                style={{
                                                  color:
                                                    TYPE_COLORS[
                                                      item?.product_type
                                                        ?.name as keyof typeof TYPE_COLORS
                                                    ] || TYPE_COLORS.Other,
                                                }}
                                              >
                                                {
                                                  item?.teethProduct
                                                    ?.custom_body_shade
                                                }{" "}
                                                {item?.teethProduct
                                                  ?.custom_body_shade
                                                  ? "(cus)"
                                                  : ""}
                                              </span>
                                            )}
                                          </span>
                                          {(item?.teethProduct?.gingival_shade
                                            ?.name ||
                                            item?.teethProduct
                                              ?.stump_shade_id ||
                                            item?.teethProduct
                                              ?.custom_gingival_shade ||
                                            item?.teethProduct
                                              ?.custom_stump_shade ||
                                            item?.teethProduct
                                              ?.manual_gingival_shade ||
                                            item?.teethProduct
                                              ?.manual_stump_shade) && (
                                            <span>,</span>
                                          )}
                                        </>
                                      )}

                                      {/* Gingival Shade */}
                                      {(item?.teethProduct?.gingival_shade
                                        ?.name ||
                                        item?.teethProduct
                                          ?.custom_gingival_shade ||
                                        item?.teethProduct
                                          ?.manual_gingival_shade) && (
                                        <>
                                          <span>
                                            <span className="font-normal">
                                              Gingival:{" "}
                                            </span>
                                            <span className="font-bold">
                                              {item?.teethProduct
                                                ?.manual_gingival_shade ||
                                                item?.teethProduct
                                                  ?.gingival_shade?.name}
                                            </span>
                                            {item?.teethProduct
                                              ?.custom_gingival_shade && (
                                              <span
                                                className="font-extrabold"
                                                style={{
                                                  color:
                                                    TYPE_COLORS[
                                                      item?.product_type
                                                        ?.name as keyof typeof TYPE_COLORS
                                                    ] || TYPE_COLORS.Other,
                                                }}
                                              >
                                                {
                                                  item?.teethProduct
                                                    ?.custom_gingival_shade
                                                }{" "}
                                                (custom)
                                              </span>
                                            )}
                                          </span>
                                          {(item?.teethProduct?.stump_shade ||
                                            item?.teethProduct
                                              ?.custom_stump_shade ||
                                            item?.teethProduct
                                              ?.manual_stump_shade) && (
                                            <span>,</span>
                                          )}
                                        </>
                                      )}

                                      {/* Stump Shade */}
                                      {(item?.teethProduct
                                        ?.custom_stump_shade ||
                                        item?.teethProduct?.stump_shade ||
                                        item?.teethProduct
                                          ?.manual_stump_shade) && (
                                        <span>
                                          <span className="font-normal">
                                            Stump:{" "}
                                          </span>
                                          <span className="font-bold">
                                            {item?.teethProduct
                                              ?.manual_stump_shade ||
                                              item?.teethProduct?.stump_shade
                                                ?.name}
                                          </span>
                                          {item?.teethProduct
                                            ?.custom_stump_shade && (
                                            <span
                                              className="font-extrabold"
                                              style={{
                                                color:
                                                  TYPE_COLORS[
                                                    item?.product_type
                                                      ?.name as keyof typeof TYPE_COLORS
                                                  ] || TYPE_COLORS.Other,
                                              }}
                                            >
                                              {
                                                item?.teethProduct
                                                  ?.custom_stump_shade
                                              }{" "}
                                              (custom)
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <p
                                  className="text-right col-span-1 pr-2 font-bold"
                                  style={{ lineHeight: "1.15" }}
                                >
                                  ${item.discounted_price.price}
                                </p>
                                <p
                                  className="text-right col-span-1 pr-2"
                                  style={{ lineHeight: "1.15" }}
                                >
                                  {item.discounted_price.discount}%
                                </p>
                                <p
                                  className="text-right col-span-2 pr-2 font-bold"
                                  style={{ lineHeight: "1.15" }}
                                >
                                  $
                                  {item.discounted_price.final_price?.toLocaleString()}
                                </p>
                                <p
                                  className="text-right col-span-2 pr-2 font-bold"
                                  style={{ lineHeight: "1.15" }}
                                >
                                  $
                                  {item.discounted_price.total?.toLocaleString()}
                                </p>
                              </div>
                              {serviceRow}
                            </React.Fragment>
                          );
                        })}

                        {/* Total and Total Due Section */}
                        <div className="flex justify-end pt-4 mt-4 border-t border-gray-800">
                          <div className="w-64">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">
                                Item Subtotal:
                              </span>
                              <span className="text-sm font-bold">
                                $
                                {(invoice?.invoice?.[0]?.amount || 0).toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">
                                Taxes:
                              </span>
                              <span className="text-sm font-bold">
                                {invoice?.invoice?.[0]?.taxes
                                  ? `$${invoice.invoice[0].taxes.toFixed(2)}`
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm font-bold">
                                Total Due:
                              </span>
                              <span className="text-sm font-bold">
                                $
                                {(
                                  invoice?.invoice?.[0]?.due_amount || 0
                                ).toFixed(2)}
                              </span>
                            </div>
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
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AddressLabelTemplate: React.FC<PrintTemplateProps> = ({
  caseData,
  paperSize,
}) => (
  <div className="h-full flex items-center justify-center p-4">
    <div className="border border-gray-300 p-6 rounded-lg w-full max-w-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xl font-bold mb-1">
            {caseData?.client?.client_name}
          </p>
          <p className="text-lg mb-2">{caseData?.client?.phone}</p>
          <p className="text-lg mb-1">Case #: {caseData?.case_number}</p>
          <p className="text-lg">Patient: {caseData?.patient_name}</p>
        </div>
        <div>
          <QRCodeSVG
            value={
              caseData?.qr_code ||
              `https://app.labulous.com/cases/${caseData?.id}`
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
      <h2 className="text-2xl font-bold mb-2">{caseData?.patient_name}</h2>
      <p className="text-xl mb-4">Case #: {caseData?.case_number}</p>
      <div className="flex justify-center mb-2">
        <QRCodeSVG
          value={
            caseData?.qr_code ||
            `https://app.labulous.com/cases/${caseData?.id}`
          }
          size={getQRCodeSize(paperSize, "medium")}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  </div>
);

export const LabSlipTemplate: React.FC<PrintTemplateProps> = ({
  caseData: caseDetail,
  caseDetails,
  paperSize,
}) => {
  // Add ArchSelector components
  const Header: React.FC<{
    caseDetail: ExtendedCase;
  }> = ({ caseDetail }) => {
    return (
      <div className="space-y-4">
        {/* First Row - Logo, Pan#, QR */}
        <div className="flex justify-between items-start">
          <div className="grid grid-cols-2 gap-x-16 items-center flex-1">
            <div>
              <img src={staticLabLogo} alt="Lab Logo" className="h-12 mb-1" />
              <div className="text-sm font-bold">
                {caseDetail?.labDetail?.name || "Solaris Dental Design"}
              </div>
            </div>
            <div className="text-2xl" style={{ lineHeight: "1.1" }}>
              <span>Pan# </span>
              <span
                className="font-bold"
                style={{ color: caseDetail?.working_pan_color }}
              >
                {(caseDetail?.working_pan_name || "N/A").toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <QRCodeSVG
              value={
                caseDetail?.id ||
                `https://app.labulous.com/cases/${caseDetail?.id}`
              }
              size={76}
              level="H"
              includeMargin={true}
            />
            <span className="text-xs">{caseDetail?.case_number}</span>
          </div>
        </div>

        {/* Second Row - Details */}
        <div
          className="grid grid-cols-2 gap-x-16 text-sm"
          style={{ lineHeight: "1.1" }}
        >
          <div>
            <div className="space-y-1">
              <div className="flex">
                <span className="w-16">Clinic:</span>
                <span className="font-bold">
                  {caseDetail?.client?.client_name}
                </span>
              </div>
              <div className="flex">
                <span className="w-16">Doctor:</span>
                <span className="font-bold">
                  {caseDetail?.doctor?.name || "N/A"}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex">
                <span className="w-16">Patient:</span>
                <span className="font-bold">
                  {caseDetail?.patient_name || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-1">
              <div className="flex">
                <span className="w-20">Received:</span>
                <span className="font-bold">
                  {caseDetail.isDueDateTBD
                    ? "TBD"
                    : formatDate(caseDetail?.received_date as string)}
                </span>
              </div>
              <div className="flex">
                <span className="w-20">Due Date:</span>
                <span className="font-bold">
                  {caseDetail.isDueDateTBD
                    ? "TBD"
                    : formatDate(caseDetail?.due_date as string)}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex">
                <span className="w-20">Appt Date:</span>
                <span className="font-bold">
                  {caseDetail.isDueDateTBD
                    ? "TBD"
                    : formatDate(caseDetail?.appointment_date as string)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-800 mt-2" />
      </div>
    );
  };

  {
    /* Item Table - Details */
  }
  const TeetDetail = ({ teeth, teethDetail, itemsLength }: any) => {
    const TYPE_FILL_CLASSES = {
      [DefaultProductType.Crown]: "fill-blue-500",
      [DefaultProductType.Bridge]: "fill-purple-500",
      [DefaultProductType.Removable]: "fill-lime-700",
      [DefaultProductType.Implant]: "fill-cyan-500",
      [DefaultProductType.Coping]: "fill-rose-900",
      [DefaultProductType.Appliance]: "fill-stone-500",
    } as const;
    const selectedTeeth = teeth.teethProduct.tooth_number;
    const getToothColor = (toothNumber: number): string => {
      const type = teeth.product_type?.name;

      // Highlight selected teeth
      if (teeth?.teethProduct?.pontic_teeth?.length > 0) {
        if (
          selectedTeeth.includes(toothNumber) &&
          !teeth?.teethProduct.pontic_teeth.includes(toothNumber)
        ) {
          if (type && type in TYPE_FILL_CLASSES) {
            return "fill-purple-300";
          }
          return "fill-gray-300"; // gray-300 fallback for selected teeth
        }

        // Highlight pontic teeth with red
        if (teeth?.teethProduct.pontic_teeth.includes(toothNumber)) {
          return "fill-purple-600"; // red for pontic teeth
        }
      }
      if (selectedTeeth.includes(toothNumber)) {
        if (type && type in TYPE_FILL_CLASSES) {
          return TYPE_FILL_CLASSES[type as DefaultProductType];
        }
        return "fill-gray-300"; // gray-300 fallback for selected teeth
      }

      // Default unselected color
      return "fill-gray-200";
    };

    const addedTeethMap = new Map();

    const formatTeethRange = (teeth: number[]): string => {
      if (!teeth.length) return "";

      // Define the sequence for upper and lower teeth based on the provided data
      const teethArray = [
        // Upper right to upper left
        18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
        // Lower left to lower right
        38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
      ];

      // Function to group consecutive teeth based on the sequence
      const getConsecutiveGroups = (teeth: number[]): string[] => {
        if (teeth.length === 0) return [];

        // Sort the teeth based on the order in teethArray
        const sortedTeeth = [...teeth].sort(
          (a, b) => teethArray.indexOf(a) - teethArray.indexOf(b)
        );

        let groups: string[] = [];
        let groupStart = sortedTeeth[0];
        let prev = sortedTeeth[0];

        for (let i = 1; i <= sortedTeeth.length; i++) {
          const current = sortedTeeth[i];

          // Check if the current tooth is consecutive to the previous one in the sequence
          if (teethArray.indexOf(current) !== teethArray.indexOf(prev) + 1) {
            // End of a group
            if (groupStart === prev) {
              groups.push(`#${groupStart}`);
            } else {
              groups.push(`#${groupStart}-#${prev}`);
            }
            groupStart = current; // Start a new group
          }
          prev = current;
        }

        return groups;
      };

      // Get consecutive groups of teeth
      const groupedTeeth = getConsecutiveGroups(teeth);

      // If there's only one group, return it
      return groupedTeeth.join(", ");
    };
    console.log(teeth.teethProduct);

    return (
      <div
        className={`grid grid-cols-${itemsLength >= 2 ? 1 : 2} gap-1 text-xs`}
        style={{ lineHeight: "1.1" }}
      >
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-16">Tooth #: </span>
            <div className="font-bold">
              {formatTeethRange(teeth?.teethProduct.tooth_number)}
            </div>
          </div>
          {teeth?.teethProduct?.pontic_teeth?.length > 0 && (
            <div className="flex ml-2">
              <span className="w-20 text-[10px]">Pontic Teeth #: </span>
              <div className="font-bold text-[10px]">
                {formatTeethRange(teeth?.teethProduct.pontic_teeth)}
              </div>
            </div>
          )}
          <div className="flex">
            <span className="w-16">Material: </span>
            <div className="font-bold">{teeth?.material?.name || "N/A"}</div>
          </div>
          <div className="flex">
            <span className="w-16">Item: </span>
            <div className="font-bold">{teeth?.name}</div>
          </div>
          <div className="pt-2">
            <div className="flex">
              <span className="w-16 text-[10px]">Shades: </span>
            </div>
            <div className="space-y-0.5 ml-4">
              <div className="flex">
                <span className="w-20 text-[10px]">Incisal: </span>
                <div className="font-bold ml-1 text-[10px]">
                  {teeth.teethProduct?.manual_occlusal_shade
                    ? teeth.teethProduct?.manual_occlusal_shade
                    : teeth.teethProduct?.occlusal_shade?.name ||
                      (teeth?.teethProduct?.custom_occlusal_shade ? (
                        <p
                          className="font-semibold ml-1"
                          style={{
                            color:
                              TYPE_COLORS[
                                teeth?.product_type
                                  ?.name as keyof typeof TYPE_COLORS
                              ] || TYPE_COLORS.Other,
                          }}
                        >
                          {teeth?.teethProduct?.custom_occlusal_shade || "N/A"}{" "}
                          {teeth?.teethProduct?.custom_occlusal_shade &&
                            "(cus)"}
                        </p>
                      ) : (
                        "N/A"
                      ))}
                </div>
              </div>
              <div className="flex">
                <span className="w-20 text-[10px]">Body: </span>
                <div className="font-bold ml-1 text-[10px]">
                  {teeth.teethProduct?.manual_body_shade
                    ? teeth.teethProduct?.manual_body_shade
                    : teeth.teethProduct?.body_shade?.name ||
                      (teeth?.teethProduct?.custom_body_shade ? (
                        <p
                          className="font-semibold ml-1"
                          style={{
                            color:
                              TYPE_COLORS[
                                teeth?.product_type
                                  ?.name as keyof typeof TYPE_COLORS
                              ] || TYPE_COLORS.Other,
                          }}
                        >
                          {teeth?.teethProduct?.custom_body_shade || "N/A"}{" "}
                          {teeth?.teethProduct?.custom_body_shade && "(cus)"}
                        </p>
                      ) : (
                        "N/A"
                      ))}
                </div>
              </div>

              <div className="flex">
                <span className="w-20 text-[10px]">Gingival: </span>
                <div className="font-bold ml-1 text-[10px]">
                  {teeth.teethProduct?.manual_gingival_shade
                    ? teeth.teethProduct?.manual_gingival_shade
                    : teeth.teethProduct?.gingival_shade?.name ||
                      (teeth?.teethProduct?.custom_gingival_shade ? (
                        <p
                          className="font-semibold ml-1"
                          style={{
                            color:
                              TYPE_COLORS[
                                teeth?.product_type
                                  ?.name as keyof typeof TYPE_COLORS
                              ] || TYPE_COLORS.Other,
                          }}
                        >
                          {teeth?.teethProduct?.custom_gingival_shade || "N/A"}
                        </p>
                      ) : (
                        "N/A"
                      ))}
                </div>
              </div>
              <div className="flex">
                <span className="w-20 text-[10px]">Stump: </span>
                <div className="font-bold ml-1 text-[10px]">
                  {teeth.teethProduct?.manual_stump_shade
                    ? teeth.teethProduct?.manual_stump_shade
                    : teeth.teethProduct?.stump_shade?.name ||
                      (teeth?.teethProduct?.custom_stump_shade ? (
                        <p
                          className="font-semibold ml-1"
                          style={{
                            color:
                              TYPE_COLORS[
                                teeth?.product_type
                                  ?.name as keyof typeof TYPE_COLORS
                              ] || TYPE_COLORS.Other,
                          }}
                        >
                          {teeth?.teethProduct?.custom_stump_shade}
                        </p>
                      ) : (
                        "N/A"
                      ))}
                </div>
              </div>
            </div>

            <div className="flex mt-2">
              <span className="w-16 text-[10px]">Note: </span>
              <div className="font-bold ml-1 text-[10px]">
                {teeth?.teethProduct?.notes || "N/A"}
              </div>
            </div>
            <div className="flex flex-col mt-2">
              <h2 className="w-16 text-[10px]">Services:</h2>
              <div className=" ml-1 text-[10px]">
                {teeth?.service ? (
                  <div>
                    <div>name : {teeth.service.name}</div>
                    <div>Price : ${teeth.service.price}</div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Selected teeth */}
        <div>
          <div
            className="relative"
            style={{
              transform:
                itemsLength === 3
                  ? "scale(0.75)"
                  : itemsLength === 2
                  ? "scale(0.6)"
                  : "scale(0.8)",
              transformOrigin: "top",
            }}
          >
            <svg
              viewBox="20 0 228 340"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Selected Teeth Text */}
              <foreignObject x="65" y="60" width="136" height="180">
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-0 text-xs"
                  style={{
                    transform:
                      itemsLength === 3
                        ? "scale(1.5)"
                        : itemsLength === 2
                        ? "scale(1.2)"
                        : "scale(1)",
                  }}
                >
                  <div className="flex">
                    <span className="w-16">Incisal: </span>
                    <div className="font-bold ml-1 flex gap-x-2">
                      <p>
                        {teeth.teethProduct?.manual_occlusal_shade
                          ? teeth.teethProduct?.manual_occlusal_shade
                          : teeth.teethProduct?.occlusal_shade?.name ||
                            (teeth?.teethProduct?.custom_occlusal_shade ? (
                              <p
                                className="font-semibold ml-1"
                                style={{
                                  color:
                                    TYPE_COLORS[
                                      teeth?.product_type
                                        ?.name as keyof typeof TYPE_COLORS
                                    ] || TYPE_COLORS.Other,
                                }}
                              >
                                {teeth?.teethProduct?.custom_occlusal_shade ||
                                  "N/A"}{" "}
                                {teeth?.teethProduct?.custom_occlusal_shade &&
                                  "(cus)"}
                              </p>
                            ) : (
                              "N/A"
                            ))}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-16">Body: </span>
                    <div className="font-bold ml-1 flex gap-x-2">
                      <p>
                        {teeth.teethProduct?.manual_body_shade
                          ? teeth.teethProduct?.manual_body_shade
                          : teeth.teethProduct?.body_shade?.name ||
                            (teeth?.teethProduct?.custom_body_shade ? (
                              <p
                                className="font-semibold ml-1"
                                style={{
                                  color:
                                    TYPE_COLORS[
                                      teeth?.product_type
                                        ?.name as keyof typeof TYPE_COLORS
                                    ] || TYPE_COLORS.Other,
                                }}
                              >
                                {teeth?.teethProduct?.custom_body_shade ||
                                  "N/A"}{" "}
                                {teeth?.teethProduct?.custom_body_shade &&
                                  "(cus)"}
                              </p>
                            ) : (
                              "N/A"
                            ))}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-16">Gingival: </span>
                    <div className="font-bold ml-1 flex gap-x-2">
                      <p>
                        {teeth.teethProduct?.manual_gingival_shade
                          ? teeth.teethProduct?.manual_gingival_shade
                          : teeth.teethProduct?.gingival_shade?.name ||
                            (teeth?.teethProduct?.custom_gingival_shade ? (
                              <p
                                className="font-semibold ml-1"
                                style={{
                                  color:
                                    TYPE_COLORS[
                                      teeth?.product_type
                                        ?.name as keyof typeof TYPE_COLORS
                                    ] || TYPE_COLORS.Other,
                                }}
                              >
                                {teeth?.teethProduct?.custom_gingival_shade ||
                                  "N/A"}
                              </p>
                            ) : (
                              "N/A"
                            ))}
                      </p>
                    </div>
                  </div>
                  <div className="h-2"></div>
                  <div className="flex">
                    <span className="w-16">Stump: </span>
                    <div className="font-bold ml-1 flex gap-x-2">
                      <p>
                        {teeth.teethProduct?.manual_stump_shade
                          ? teeth.teethProduct?.manual_stump_shade
                          : teeth.teethProduct?.stump_shade?.name ||
                            (teeth?.teethProduct?.custom_stump_shade ? (
                              <p
                                className="font-semibold ml-1"
                                style={{
                                  color:
                                    TYPE_COLORS[
                                      teeth?.product_type
                                        ?.name as keyof typeof TYPE_COLORS
                                    ] || TYPE_COLORS.Other,
                                }}
                              >
                                {teeth?.teethProduct?.custom_stump_shade}
                              </p>
                            ) : (
                              "N/A"
                            ))}
                      </p>
                    </div>
                  </div>
                </div>
              </foreignObject>

              {/* Upper Teeth Group */}
              <g>
                {teethData.map((tooth) => (
                  <g key={`upper-${tooth.number}`}>
                    <path
                      d={tooth.path}
                      className={cn(
                        "transition-colors cursor-pointer",
                        getToothColor(tooth.number)
                      )}
                    />
                    <text
                      x={tooth.x}
                      y={tooth.y}
                      className={cn(
                        "text-[8px] pointer-events-none select-none",
                        selectedTeeth.includes(tooth.number)
                          ? "fill-white"
                          : "fill-current"
                      )}
                      textAnchor="middle"
                    >
                      {tooth.number}
                    </text>
                    {/* Corner Marker */}
                    {addedTeethMap?.has(tooth.number) && (
                      <circle
                        cx={
                          tooth.number >= 11 && tooth.number <= 18
                            ? tooth.x - 8
                            : tooth.x + 8
                        }
                        cy={tooth.y - 8}
                        r="2"
                        className={cn(
                          "pointer-events-none",
                          addedTeethMap.get(tooth.number)
                            ? "fill-purple-500"
                            : "fill-blue-500"
                        )}
                      />
                    )}
                  </g>
                ))}
              </g>

              {/* Lower Teeth Group - Mirrored */}
              <g transform="translate(0,320) scale(1,-1)">
                {teethData.map((tooth) => {
                  const lowerToothNumber = (() => {
                    if (tooth.number >= 11 && tooth.number <= 18) {
                      return tooth.number + 30; // 11-18 -> 41-48
                    } else if (tooth.number >= 21 && tooth.number <= 28) {
                      return tooth.number + 10; // 21-28 -> 31-38
                    }
                    return tooth.number;
                  })();

                  return (
                    <g key={`lower-${lowerToothNumber}`}>
                      <path
                        d={tooth.path}
                        className={cn(
                          "transition-colors cursor-pointer",
                          getToothColor(lowerToothNumber)
                        )}
                      />
                      <text
                        x={tooth.x}
                        y={-tooth.y - -5}
                        className={cn(
                          "text-[8px] pointer-events-none select-none",
                          selectedTeeth.includes(lowerToothNumber)
                            ? "fill-white"
                            : "fill-current"
                        )}
                        textAnchor="middle"
                        transform="scale(1,-1)"
                      >
                        {lowerToothNumber}
                      </text>
                      {/* Corner Marker - Now positioned at bottom and in front */}
                      {addedTeethMap?.has(lowerToothNumber) && (
                        <g transform="scale(1,-1)">
                          <circle
                            cx={
                              lowerToothNumber >= 41 && lowerToothNumber <= 48
                                ? tooth.x - 8
                                : tooth.x + 8
                            }
                            cy={-tooth.y + 8}
                            r="2"
                            className={cn(
                              "pointer-events-none",
                              addedTeethMap.get(lowerToothNumber)
                                ? "fill-purple-500"
                                : "fill-blue-500"
                            )}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  };
  const cases = caseDetails?.map((caseItem) => {
    if (!caseItem.products || !Array.isArray(caseItem.products)) {
      return caseItem; // If products are missing or not an array, return case as is
    }

    const consolidatedProducts = Object.values(
      caseItem.products.reduce((acc: any, product: any) => {
        const productId = product.id;

        // Check if the product has a valid id and teethProduct with tooth_number
        if (!productId || !product.teethProduct?.tooth_number) {
          return acc;
        }

        // If the product already exists in the accumulator, merge the tooth numbers and sum prices
        if (acc[productId]) {
          acc[productId].teethProduct.tooth_number = [
            ...new Set([
              ...acc[productId].teethProduct.tooth_number,
              ...product.teethProduct.tooth_number,
            ]),
          ];

          // Sum the discounted prices
          if (acc[productId].discounted_price && product.discounted_price) {
            acc[productId].discounted_price.price +=
              product.discounted_price.price;
            acc[productId].discounted_price.final_price +=
              product.discounted_price.final_price;
            acc[productId].discounted_price.total +=
              product.discounted_price.total;
          }
        } else {
          // If the product is not yet in the accumulator, add it as is (with its tooth numbers)
          acc[productId] = {
            ...product,
            teethProduct: {
              ...product.teethProduct,
              tooth_number: [...product.teethProduct.tooth_number], // Initialize with current tooth_number
            },
          };
        }

        return acc;
      }, {})
    );

    return {
      ...caseItem,
      products: consolidatedProducts, // Replace products with the consolidated ones
    };
  });

  return (
    <div>
      {cases?.map((item, index) => {
        console.log(item, "item");
        return (
          <div
            key={index}
            className="min-h-[277mm] w-[180mm] mx-auto bg-white"
            style={{
              height: "277mm", // Fixed height to match LETTER page size
            }}
          >
            <div className="border border-gray-800">
              <div className="p-5">
                <Header caseDetail={item} />

                <div className={`grid grid-cols-${item.products.length} gap-0`}>
                  {item.products.map((teeth: any, index: number) => {
                    return (
                      <div key={index}>
                        <div className="border border-gray-300">
                          <div className="bg-gray-100 p-2">
                            <h3
                              className="font-bold text-xs"
                              style={{ lineHeight: "1.15" }}
                            >
                              Item #{index + 1}
                            </h3>
                          </div>
                          <div
                            className="p-4"
                            style={{ maxHeight: "400px", overflowY: "hidden" }}
                          >
                            <TeetDetail
                              teeth={teeth}
                              teethDetail={item}
                              itemsLength={item.products.length}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 border border-gray-300">
                  <div className="bg-gray-100 p-2">
                    <h3
                      className="font-bold text-xs"
                      style={{ lineHeight: "1.15" }}
                    >
                      Case Details
                    </h3>
                  </div>
                  <div className="p-2">
                    <div className="grid grid-cols-6 gap-4">
                      <div>
                        <div className="text-[10px] text-gray-600">
                          Occlusal Type
                        </div>
                        <div className="font-bold text-[10px] min-h-[14px]">
                          {item.occlusal_type ||
                            item.custom_occlusal_details ||
                            ""}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-600">
                          Contact Type
                        </div>
                        <div className="font-bold text-[10px] min-h-[14px]">
                          {item.contact_type === "not_applicable"
                            ? ""
                            : item.contact_type ||
                              item.custom_contact_details ||
                              ""}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-600">
                          Pontic Type
                        </div>
                        <div className="font-bold text-[10px] min-h-[14px]">
                          {item.pontic_type === "not_applicable"
                            ? ""
                            : item.pontic_type ||
                              item.custom_pontic_details ||
                              ""}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-600">
                          Margin Design
                        </div>
                        <div className="font-bold text-[10px] min-h-[14px]">
                          {item.margin_design_type === "not_applicable"
                            ? ""
                            : item.margin_design_type ||
                              item.custom_margin_design_type ||
                              ""}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-600">
                          Occlusal Design
                        </div>
                        <div className="font-bold text-[10px] min-h-[14px]">
                          {item.occlusion_design_type === "not_applicable"
                            ? ""
                            : item.occlusion_design_type ||
                              item.custom_occlusion_design_type ||
                              ""}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-600">Alloy</div>
                        <div className="font-bold text-[10px] min-h-[14px]">
                          {item.alloy_type === "not_applicable"
                            ? ""
                            : item.alloy_type || item.custon_alloy_type || ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 border border-gray-300">
                  <div className="bg-gray-100 p-2">
                    <h3
                      className="font-bold text-xs"
                      style={{ lineHeight: "1.15" }}
                    >
                      Instruction Notes
                    </h3>
                  </div>
                  <div
                    className="p-4 whitespace-pre-wrap break-words overflow-hidden"
                    style={{ height: "80px" }}
                  >
                    <div className="font-bold text-sm">
                      {item?.instruction_notes || ""}
                    </div>
                  </div>
                </div>
                <div className="flex mt-2">
                  <span className="w-16 text-sm">Enclosed: </span>
                  <div className="font-bold text-sm ml-2">
                    {[
                      { key: "impression", label: "Impression" },
                      { key: "biteRegistration", label: "Bite Registration" },
                      { key: "photos", label: "Photos" },
                      { key: "jig", label: "Jig" },
                      { key: "opposingModel", label: "Opposing Model" },
                      { key: "articulator", label: "Articulator" },
                      { key: "returnArticulator", label: "Return Articulator" },
                      { key: "cadcamFiles", label: "CAD/CAM Files" },
                      { key: "consultRequested", label: "Consult Requested" },
                    ]
                      .filter(
                        (enclosed) =>
                          item?.enclosed_items?.[
                            enclosed.key as keyof typeof item.enclosed_items
                          ]
                      )
                      .map((enclosed) => {
                        const quantity =
                          item?.enclosed_items?.[
                            enclosed.key as keyof typeof item.enclosed_items
                          ];
                        return quantity
                          ? `${quantity} x ${enclosed.label}`
                          : "";
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const PaymentReceiptTemplate: React.FC<PrintStatementTemplateProps> = ({
  caseDetails,
  labData,
  paperSize,
}) => {
  // Add ArchSelector components

  const Header: React.FC<{
    statement: any;
  }> = ({ statement }) => {
    return (
      <div>
        <div>
          <div className="py-2">
            <div className="flex justify-between items-start">
              {/* Left Section */}
              <div className="flex-1">
                <div className="grid grid-cols-2">
                  <img
                    src={
                      labData?.attachements
                        ? labData.attachements
                        : staticLabLogo
                    }
                    alt="Lab Logo"
                    className="h-10 mb-2"
                  />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <div>
                      <div>{labData?.name}</div>
                      <div>{labData?.office_address?.address_1}</div>
                      <div>
                        {labData?.office_address?.city &&
                        labData?.office_address?.state_province &&
                        labData?.office_address?.zip_postal
                          ? `${labData.office_address.city}, ${labData.office_address.state_province} ${labData.office_address.zip_postal}`
                          : ""}
                      </div>
                      <div>{labData?.office_address?.phone_number}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex-1">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6"></div>
                  <div className="col-span-6">
                    <p>
                      <strong>PAYMENT RECEIPT</strong>{" "}
                    </p>
                    <p>{moment(statement.payment_date).format("DD/MM/YYYY")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {caseDetails &&
        caseDetails?.map((item, index) => {
          console.log(item, "item");
          return (
            <div
              key={index}
              className="min-h-[277mm] w-[180mm] mx-auto bg-white"
              style={{
                height: "277mm",
              }}
            >
              <div className="border border-gray-800">
                <div className="p-5">
                  <Header statement={item} />
                  <div
                    className="border-2 my-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ marginBottom: "8px" }}>
                        <strong>Received from :</strong>{" "}
                        {item.clients.client_name}
                      </p>
                      <p style={{ marginBottom: "8px" }}>
                        <strong>Amount:</strong> $
                        {item.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p style={{ marginBottom: "8px" }}>
                        <strong>Payment Method :</strong> {item.payment_method}
                      </p>
                      <p style={{ marginBottom: "8px" }}>
                        <strong>Status :</strong> {item.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export const AdjustmentReceiptTemplate: React.FC<
  PrintStatementTemplateProps
> = ({ caseDetails, labData, paperSize }) => {
  // Add ArchSelector components

  const Header: React.FC<{
    adjustment: any;
  }> = ({ adjustment }) => {
    console.log("case Details", caseDetails);
    console.log("Lab Data", labData);

    return (
      <div>
        <div>
          <div className="py-2">
            <div className="flex justify-between items-start">
              {/* Left Section */}
              <div className="flex-1">
                <div className="grid grid-cols-2">
                  <img
                    src={
                      labData?.attachements
                        ? labData.attachements
                        : staticLabLogo
                    }
                  />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <div>
                      <div>{labData?.name}</div>
                      <div>{labData?.office_address?.address_1}</div>
                      <div>
                        {labData?.office_address?.city &&
                        labData?.office_address?.state_province &&
                        labData?.office_address?.zip_postal
                          ? `${labData.office_address.city}, ${labData.office_address.state_province} ${labData.office_address.zip_postal}`
                          : ""}
                      </div>
                      <div>{labData?.office_address?.phone_number}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex-1">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6"></div>
                  <div className="col-span-6">
                    <p>
                      <strong>
                        {adjustment.credit_amount > 0
                          ? "Credit Memo"
                          : adjustment.debit_amount > 0
                          ? "Debit Memo"
                          : ""}
                      </strong>{" "}
                    </p>
                    <p>
                      {moment(adjustment.payment_date).format("DD/MM/YYYY")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {caseDetails &&
        caseDetails?.map((item, index) => {
          console.log(item, "item");
          return (
            <div
              key={index}
              className="min-h-[277mm] w-[180mm] mx-auto bg-white"
              style={{
                height: "277mm",
              }}
            >
              <div className="border border-gray-800">
                <div className="p-5">
                  <Header adjustment={item} />
                  <div
                    className="border-2 my-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ marginBottom: "8px" }}>
                        <strong>Received from :</strong>{" "}
                        {item.client.client_name}
                      </p>
                      <p style={{ marginBottom: "8px" }}>
                        <strong>
                          {item.credit_amount > 0
                            ? "Credit Amount: "
                            : "Debit Amount: "}
                        </strong>
                        $
                        {item.credit_amount > 0
                          ? item.credit_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : item.debit_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </p>

                      <p style={{ marginBottom: "8px" }}>
                        <strong>Description :</strong> {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export const StatementReceiptTemplate: React.FC<
  PrintStatementTemplateProps
> = ({ caseDetails, labData, paperSize }) => {
  // Add ArchSelector components

  const Header: React.FC<{
    adjustment: any;
  }> = ({ adjustment }) => {
    console.log("case Details", caseDetails);
    console.log("Lab Data", labData);

    const caseDetail = {
      accountNumber: "A123456789",
      amountDue: 245.75,
      dueDate: "2025-02-15",
      transactions: caseDetails?.length ? caseDetails[0].invoiceData : [],
      previousBalance: 100.0,
      payments: 0.0,
    };

    const previousBalance =
      caseDetail?.transactions?.find(
        (transaction: any) => transaction.type === "PB"
      )?.balance || 0;

    const totalPayment = caseDetail?.transactions
      ?.filter((transaction: any) => transaction.type === "P")
      ?.reduce((total: any, item: any) => total + (item.amount || 0), 0);

    const totalInvoice = caseDetail?.transactions
      ?.filter((transaction: any) => transaction.type === "I")
      ?.reduce((total: any, item: any) => total + (item.amount || 0), 0);

    const total_due_amount = totalInvoice - totalPayment + previousBalance;

    return (
      <div className="w-[600px] mx-auto p-8 bg-white border text-xs border-gray-300">
        <div className="flex justify-between">
          <div>
            <h2 className="text-xs font-bold">{labData?.name}</h2>
            <p>{labData?.office_address?.address_1}</p>
            <p>
              {labData?.office_address?.city},{" "}
              {labData?.office_address?.state_province}{" "}
              {labData?.office_address?.zip_postal}
            </p>
            <p>{labData?.office_address?.phone_number}</p>
          </div>

          <div className="text-right">
            <p className="font-bold">
              Account #:{" "}
              {caseDetails?.length
                ? caseDetails[0].client?.account_number
                : "N/A"}
            </p>
            <p className="text-sm">
              Statement of{" "}
              {caseDetails?.length
                ? moment(caseDetails[0].statement.created_at).format(
                    "MMMM YYYY"
                  )
                : "N/A"}
            </p>

            <table className="w-full border-collapse border border-gray-200 mt-4 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-xs text-center">
                    Amount Due
                  </th>
                  <th className="border border-gray-300 p-1 text-xs text-center">
                    Due By
                  </th>
                  <th className="border border-gray-300 p-1 text-xs text-center">
                    Enclosed
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-300">
                  <td className="border border-gray-300 p-1 font-bold text-xs">
                    $
                    {caseDetails?.length
                      ? caseDetails[0].statement.outstanding.toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="border border-gray-300 p-1">
                    {caseDetails?.length
                      ? moment(caseDetails[0].statement.created_at)
                          .add(30, "days")
                          .format("MM/DD/YYYY")
                      : "N/A"}
                  </td>
                  <td className="border border-gray-300 p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 mb-100">
          <h2 className="text-small">
            {caseDetails?.length ? caseDetails[0].client.client_name : ""}
          </h2>
          <p>{caseDetails?.length ? caseDetails[0].client.street : ""}</p>
          <p>
            {caseDetails?.length ? caseDetails[0].client.city : ""} ,{" "}
            {caseDetails?.length ? caseDetails[0].client.state : ""}
          </p>
        </div>
        <p className="text-center text-xs mb-1 mt-5">
          Return this portion with your payment
        </p>
        <hr className="border-dashed border-gray-500" />

        <h3 className="text-center font-bold text-xl mt-5">Statement</h3>

        <div className="left-0 w-full flex text-xs justify-between items-start p-4">
          <div className="text-left">
            <img src={staticLabLogo} className="w-20 h-20 object-contain" />
            <h2 className="text-small font-bold">{labData?.name}</h2>
            <p>{labData?.office_address?.address_1}</p>
            <p>
              {labData?.office_address?.city},{" "}
              {labData?.office_address?.state_province}{" "}
              {labData?.office_address?.zip_postal}
            </p>
            <p>{labData?.office_address?.phone_number}</p>
          </div>

          <div className="text-right">
            <p className="text-xs">
              Statement of{" "}
              {caseDetails?.length
                ? moment(caseDetails[0].statement.created_at).format(
                    "MMMM YYYY"
                  )
                : ""}{" "}
              for {caseDetails?.length ? caseDetails[0].client.client_name : ""}
            </p>
            <p className="text-xs">
              {" "}
              Account #:{" "}
              {caseDetails?.length
                ? caseDetails[0].client?.account_number
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="text-xs  ">
          <table className="w-full border-collapse border border-gray-400 mt-4 text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 p-2">Date</th>
                <th className="border border-gray-400 p-2">Activity</th>
                <th className="border border-gray-400 p-2">Amount</th>
                <th className="border border-gray-400 p-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {caseDetail?.transactions?.map((transaction: any, index: any) => (
                <tr key={index} className="border border-gray-400">
                  <td className="p-2 border border-gray-400">
                    {transaction?.date && moment(transaction.date).isValid()
                      ? moment(transaction.date).format("MM/DD/YYYY")
                      : ""}
                  </td>
                  <td className="p-2 border border-gray-400">
                    {transaction.activity}
                  </td>
                  <td className="p-2 border border-gray-400 text-right">
                    {transaction?.type === "PB"
                      ? ""
                      : typeof transaction?.amount === "number"
                      ? transaction?.type === "P"
                        ? `($${transaction.amount.toFixed(2)})`
                        : `$${transaction.amount.toFixed(2)}`
                      : ""}
                  </td>
                  <td className="p-2 border border-gray-400 text-right">
                    ${transaction.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-t border-gray-500 pt-3 text-xs text-right">
          <p>
            <strong>Previous Balance : </strong> ${previousBalance.toFixed(2)}
          </p>
          <p>
            <strong>Payments : </strong> ${totalPayment.toFixed(2)}
          </p>
          <p>
            <strong>Current : </strong> ${total_due_amount.toFixed(2)}
          </p>
          <p className="font-bold">
            Amount Due : ${total_due_amount.toFixed(2)}
          </p>
        </div>

        <p className="text-center mt-6">Thank you for your business!</p>
      </div>
    );
  };

  return (
    <div>
      {caseDetails &&
        caseDetails.length > 0 &&
        caseDetails?.map((item, index) => {
          console.log(item, "item");
          return (
            <div
              key={index}
              className="min-h-[277mm] w-[180mm] mx-auto bg-white"
              style={{
                height: "277mm",
              }}
            >
              <div className="border border-gray-800">
                <div className="p-5">
                  <Header adjustment={item} />
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
