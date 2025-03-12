import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  QRCodeTemplate,
  LabSlipTemplate,
  AddressLabelTemplate,
  PatientLabelTemplate,
  InvoiceTemplate,
  AdjustmentReceiptTemplate,
  PaymentReceiptTemplate,
  StatementReceiptTemplate,
  SelectedOrderTemplate,
} from "@/components/cases/print/PrintTemplates";
import { PAPER_SIZES } from "@/components/cases/print/PrintHandler";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ExtendedCase } from "@/components/cases/CaseDetails";

interface PrintTemplateProps {
  caseData:
    | {
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
      }
    | {
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
      }[];
  caseDetails?: ExtendedCase[];
  paperSize: keyof typeof PAPER_SIZES;
  ref?: any;
}

interface PrintPreviewState {
  type:
    | "qr-code"
    | "lab-slip"
    | "address-label"
    | "patient-label"
    | "invoice_slip"
    | "payment_receipt"
    | "adjustment_receipt"
    | "statement_receipt"
    | "selected-order";
  paperSize: keyof typeof PAPER_SIZES;
  caseData:
    | {
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
      }
    | {
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
      }[];
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
      const storedState = localStorage.getItem("printData");
      if (!storedState) {
        throw new Error("No preview state found in localStorage");
      }

      const decodedState = JSON.parse(storedState);

      if (!decodedState) {
        throw new Error("Decoded state is empty or invalid");
      }

      setPreviewState(decodedState);
      console.log("Decoded State:", decodedState);
    } catch (error) {
      console.error("Error parsing state:", error);
      // navigate("/", { replace: true });
    }
  }, []);

  if (!previewState) {
    return <>Loading....</>;
  }

  console.log("Decoded State:", previewState);

  const { type, paperSize = "LETTER", caseData, caseDetails } = previewState;

  const handlePrint = () => {
    window.print();
  };

  // If caseData is an array, we're doing batch printing
  console.log("printing type bgfgfgfgfgffg", type);
  console.log(caseDetails, "caseDetails");
  console.log(caseData, "lab datatat");
  const renderTemplate = () => {
    if (Array.isArray(caseData)) {
      if (type === "lab-slip") {
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
                if (
                  acc[productId].discounted_price &&
                  product.discounted_price
                ) {
                  acc[productId].discounted_price.price +=
                    product.discounted_price.price;
                  acc[productId].discounted_price.final_price +=
                    product.discounted_price.final_price;
                  acc[productId].discounted_price.total +=
                    product.discounted_price.total;
                }

                // Check for service differences and associate teeth numbers with each service
                if (product.service) {
                  const existingService = acc[productId].service.find(
                    (serviceObj: any) => serviceObj.service === product.service
                  );

                  if (existingService) {
                    // If the service already exists, merge the teeth numbers
                    existingService.teeth_number = [
                      ...new Set([
                        ...existingService.teeth_number,
                        ...product.teethProduct.tooth_number,
                      ]),
                    ];
                  } else {
                    // If the service doesn't exist, add it with the corresponding teeth numbers
                    acc[productId].service.push({
                      service: product.service,
                      teeth_number: [...product.teethProduct.tooth_number],
                    });
                  }
                }
              } else {
                // If the product is not yet in the accumulator, add it as is (with its tooth numbers)
                acc[productId] = {
                  ...product,
                  teethProduct: {
                    ...product.teethProduct,
                    tooth_number: [...product.teethProduct.tooth_number], // Initialize with current tooth_number
                  },
                  service: product.service
                    ? [
                        {
                          service: product.service,
                          teeth_number: [...product.teethProduct.tooth_number], // Initialize with current teeth_number
                        },
                      ]
                    : [], // Initialize with current service in an array
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
        return caseDetails?.map((singleProps, index) => {
          console.log(singleProps, "singleProps second");
          return (
            <>case details</>
          );
        });
      } else {
        return caseData.map((singleCaseData, index) => {
          const singleProps = {
            caseData: singleCaseData,
            paperSize,
            caseDetails,
          };
          switch (type) {
            case "qr-code":
              return <QRCodeTemplate key={index} {...singleProps} />;

            case "address-label":
              return <AddressLabelTemplate key={index} {...singleProps} />;
            case "patient-label":
              return <PatientLabelTemplate key={index} {...singleProps} />;
            case "invoice_slip":
              return <InvoiceTemplate key={index} {...singleProps} />;
            case "selected-order":
              return <SelectedOrderTemplate key={index} {...singleProps} />;
            default:
              return <div key={index}>Invalid template type</div>;
          }
        });
      }
    }

    // Single case printing
    const props = {
      caseData,
      paperSize,
      caseDetails,
    };
    console.log(caseDetails, "case details.");
    switch (type) {
      case "qr-code":
        return <QRCodeTemplate {...props} />;
      case "lab-slip":
        return props.caseDetails?.map((singleProps, index) => {
          console.log(singleProps, "singleProps");
          return (
            <LabSlipTemplate
              paperSize="LETTER"
              key={index}
              caseDetails={singleProps}
              caseData={caseDetails}
            />
          );
        });
      case "address-label":
        return <AddressLabelTemplate {...props} />;
      case "patient-label":
        return <PatientLabelTemplate {...props} />;
      case "invoice_slip":
        return <InvoiceTemplate {...props} />;
      case "statement_receipt":
        return <StatementReceiptTemplate {...props} labData={caseData} />;
      case "payment_receipt":
        return (
          <PaymentReceiptTemplate
            paperSize={paperSize}
            labData={caseData}
            caseDetails={caseDetails}
          />
        );

      case "adjustment_receipt":
        return (
          <AdjustmentReceiptTemplate
            paperSize={paperSize}
            labData={caseData}
            caseDetails={caseDetails}
          />
        );

      case "selected-order":
        return (
          <SelectedOrderTemplate
            paperSize={paperSize}
            caseDetails={caseDetails}
          />
        );

      default:
        return <div>Invalid template type</div>;
    }
  };

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

        <div className="bg-white shadow-lg rounded-lg overflow-auto">
          <div className="print-content">
            {Array.isArray(caseData) ? (
              caseData.map((_, index) => (
                <div
                  key={index}
                  style={containerStyle}
                  className="print-container mb-8"
                >
                  {(renderTemplate() as React.ReactElement[])[index]}
                </div>
              ))
            ) : (
              <div style={containerStyle} className="print-container">
                {renderTemplate()}
              </div>
            )}
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
              counter-increment: page;
            }

            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden;
            }

            .print-content, .print-content * {
              visibility: visible;
            }

            .print-container {
              position: relative;
              margin: 0;
              padding: 0;
              break-inside: avoid;
              page-break-inside: avoid;
              page-break-after: always;
              page-break-before: always;
            }

            .print-container:last-child {
              page-break-after: avoid;
            }

            /* Hide scrollbars during print */
            .overflow-auto {
              overflow: visible !important;
            }

            /* Reset margin for print */
            .mb-8 {
              margin: 0 !important;
            }

            /* Footer for page numbering */
            .page-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 12px;
              padding: 10px;
            }

            .page-footer .page-number:after {
              content: "Page " counter(page) " of " counter(pages);
            }
          }
        `}
      </style>

      {/* Footer for page numbering */}
      <div className="page-footer">
        <span className="page-number"></span>
      </div>
    </div>
  );
};
export default PrintPreview;
