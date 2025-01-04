import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  FileText,
  Package,
  CircleDot,
  MoreHorizontal,
  Printer,
  CheckCircle2,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Case, CaseProduct, ToothInfo, CaseStatus, CASE_STATUS_DESCRIPTIONS } from "@/types/supabase";
import CaseProgress from "./CaseProgress";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import cn from "classnames";

interface CaseFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  lead_time: string | null;
  is_client_visible: boolean;
  is_taxable: boolean;
  created_at: string;
  updated_at: string;
  requires_shade: boolean;
  material?: Material;
  product_type: ProductType;
  billing_type: BillingType;
  discounted_price?: DiscountedPrice;
  contact_type: string;
}

interface Material {
  name: string;
  is_active: boolean;
  description: string;
}

interface ProductType {
  name: string;
  is_active: boolean;
  description: string;
}

interface BillingType {
  name: string;
  label: string;
  is_active: boolean;
  description: string;
}

interface DiscountedPrice {
  product_id: string;
  discount: number;
  final_price: number;
  price: number;
}

interface ExtendedCase extends Case {
  client: {
    id: string;
    client_name: string;
    phone: string;
  };
  doctor: {
    id: string;
    name: string;
    client: {
      id: string;
      client_name: string;
      phone: string;
    };
  };
  case_number: string;
  case_products: CaseProduct[];
  product_ids: {
    id: string;
    products_id: string[];
  }[];
  lab_notes: string;
  technician_notes: string;
  otherItems: string;
  custom_contact_details: string;
  custom_occulusal_details: string;
  custom_pontic_details: string;
  custom_occlusal_details: string;
  occlusal_type: string;
  pontic_type: string;
  contact_type: string;
  enclosed_items: {
    jig: number;
    photos: number;
    user_id: string;
    impression: number;
    articulator: number;
    cadcamFiles: number;
    opposingModel: number;
    biteRegistration: number;
    consultRequested: number;
    returnArticulator: number;
  };
  products: any[];
  invoice: {
    id: string;
    case_id: string;
    amount: number;
    status: string;
    due_date: string;
  };
}

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

const formatTeethRange = (teeth: number[]): string => {
  if (!teeth || teeth.length === 0) return "";

  const ranges: string[] = [];
  let start = teeth[0];
  let end = teeth[0];

  for (let i = 1; i <= teeth.length; i++) {
    if (i < teeth.length && teeth[i] === end + 1) {
      end = teeth[i];
    } else {
      ranges.push(start === end ? start.toString() : `${start}-${end}`);
      if (i < teeth.length) {
        start = teeth[i];
        end = teeth[i];
      }
    }
  }

  return ranges.join(", ");
};

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseDetail, setCaseDetail] = useState<ExtendedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  let location = useLocation();
  useEffect(() => {
    if (!caseId) {
      setError("No case ID provided");
      setLoading(false);
      return;
    }

    const fetchCaseData = async () => {
      try {
        const { data: caseData, error } = await supabase
          .from("cases")
          .select(
            `
              id,
              created_at,
              received_date,
              ship_date,
              status,
              patient_name,
              case_number,
              due_date,
              invoice:invoices!case_id (
                id,
                case_id,
                amount,
                status,
                due_date
              ),
              client:clients!client_id (
                id,
                client_name,
                phone
              ),
              doctor:doctors!doctor_id (
                id,
                name,
                client:clients!client_id (
                  id,
                  client_name,
                  phone
                )
              ),
              pan_number,
              rx_number,
              received_date,
              isDueDateTBD,
              appointment_date,
              otherItems,
              lab_notes,
              technician_notes,
              occlusal_type,
              contact_type,
              pontic_type,
              qr_code,
              custom_contact_details,
              custom_occulusal_details,
              custom_pontic_details,
              enclosed_items:enclosed_case!enclosed_case_id (
                impression,
                biteRegistration,
                photos,
                jig,
                opposingModel,
                articulator,
                returnArticulator,
                cadcamFiles,
                consultRequested,
                user_id
              ),
              product_ids:case_products!id (
                products_id,
                id
              )
            `
          )
          .eq("id", caseId)
          .single();

        if (error) {
          console.error("Supabase error:", error);
          setError(error.message);
          return;
        }

        if (!caseData) {
          console.error("No case data found");
          setError("Case not found");
          return;
        }

        const caseDetails: any = caseData;
        const productsIdArray = caseDetails?.product_ids[0].products_id;
        const caseProductId = caseDetails?.product_ids[0]?.id;

        let products: Product[] = [];
        let teethProducts: ToothInfo[] = [];
        let discountedPrices: DiscountedPrice[];

        if (productsIdArray?.length > 0) {
          const { data: productData, error: productsError } = await supabase
            .from("products")
            .select(
              `
                id,
                name,
                price,
                lead_time,
                is_client_visible,
                is_taxable,
                created_at,
                updated_at,
                requires_shade,
                material:materials!material_id (
                  name,
                  description,
                  is_active
                ),
                product_type:product_types!product_type_id (
                  name,
                  description,
                  is_active
                ),
                billing_type:billing_types!billing_type_id (
                  name,
                  label,
                  description,
                  is_active
                )
              `
            )
            .in("id", productsIdArray);

          if (productsError) {
            setError(productsError.message);
          } else {
            const productsData: any[] = productData.map((item: any) => ({
              ...item,
              material: {
                name: item.name,
                description: item.description,
                is_active: item.is_active,
              },
            }));
            products = productsData;
          }

          const { data: discountedPriceData, error: discountedPriceError } =
            await supabase
              .from("discounted_price")
              .select(
                `
                product_id,
                discount,
                final_price,
                price,
                quantity
              `
              )
              .in("product_id", productsIdArray)
              .eq("case_id", caseDetails.id);

          if (discountedPriceError) {
            console.error(
              "Error fetching discounted prices:",
              discountedPriceError
            );
            setError(discountedPriceError.message);
          } else {
            discountedPrices = discountedPriceData.map((item: any) => item);
          }
        } else {
          console.log("No products associated with this case.");
        }

        if (caseProductId) {
          const { data: teethProductData, error: teethProductsError } =
            await supabase
              .from("case_product_teeth")
              .select(
                `
                is_range,
                occlusal_shade:shade_options!occlusal_shade_id (
                  name,
                  category,
                  is_active
                ),
                body_shade:shade_options!body_shade_id (
                  name,
                  category,
                  is_active
                ),
                gingival_shade:shade_options!gingival_shade_id (
                  name,
                  category,
                  is_active
                ),
                stump_shade_id:shade_options!stump_shade_id (
                  name,
                  category,
                  is_active
                ),
                tooth_number,
                notes,
                product_id
              `
              )
              .eq("case_product_id", caseProductId);

          if (teethProductsError) {
            setError(teethProductsError.message);
          } else {
            teethProducts = teethProductData.map((item: any) => item);
          }
        } else {
          console.log("No caseProductId found for fetching teeth products.");
        }
        const productsWithDiscounts = products.map((product: any) => {
          const discountedPrice = discountedPrices.find(
            (discount: { product_id: string }) =>
              discount.product_id === product.id
          );
          const productTeeth = teethProducts.find(
            (teeth: any) => teeth.product_id === product.id
          );
          return {
            ...product,
            discounted_price: discountedPrice,
            teethProduct: productTeeth,
          };
        });

        setCaseDetail({
          ...(caseData as any),
          products: productsWithDiscounts,
        });
      } catch (error) {
        console.error("Error fetching case data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId]);

  const handleCompleteStage = async (stageName: string) => {
    console.log(`Completing stage: ${stageName}`);
  };

  const handlePhotoUpload = async (file: File) => {
    console.log(`Uploading photo: ${file.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg">
          <div className="text-red-600 text-xl mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No case details found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-16 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <QRCodeSVG
                  value={`/${location.pathname}`}
                  size={64}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight mb-4">
                  {caseDetail.patient_name
                    ? caseDetail.patient_name
                    : "Unknown Patient"}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Case #:</span>
                    <span className="text-sm font-medium text-primary">
                      {caseDetail?.case_number || "N/A"}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Invoice #:</span>
                    <span className="text-sm font-medium text-primary">
                      {caseDetail?.invoice?.case_id || "Not Invoiced"}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          className={cn(
                            "bg-opacity-10 capitalize hover:bg-opacity-10 hover:text-inherit",
                            {
                              "bg-neutral-500 text-neutral-500 hover:bg-neutral-500": caseDetail.status === "in_queue",
                              "bg-blue-500 text-blue-500 hover:bg-blue-500": caseDetail.status === "in_progress",
                              "bg-yellow-500 text-yellow-500 hover:bg-yellow-500": caseDetail.status === "on_hold",
                              "bg-green-500 text-green-500 hover:bg-green-500": caseDetail.status === "completed",
                              "bg-red-500 text-red-500 hover:bg-red-500": caseDetail.status === "cancelled"
                            }
                          )}
                        >
                          {caseDetail.status.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS[caseDetail.status as CaseStatus]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-6">
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Print Case Details</DropdownMenuItem>
                    <DropdownMenuItem>Print Label</DropdownMenuItem>
                    <DropdownMenuItem>Print Invoice</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit Case</DropdownMenuItem>
                    <DropdownMenuItem>Delete Case</DropdownMenuItem>
                    <DropdownMenuItem>Archive Case</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button>Complete</Button>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Received Date</span>
                  <span className="font-medium">
                    {new Date(caseDetail.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="font-medium">
                    {new Date(caseDetail.due_date).toLocaleDateString()}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Appointment</span>
                  <span className="font-medium">Not Set</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CircleDot className="mr-2" size={20} /> Case Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <CaseProgress
                  steps={[
                    {
                      date: caseDetail.created_at || new Date().toISOString(),
                      condition: "Case Created",
                      technician: "System",
                      status: "done",
                      notes:
                        "Case has been created and is ready for processing",
                    },
                    {
                      date: caseDetail.updated_at || new Date().toISOString(),
                      condition: "In Queue",
                      treatment: "Waiting for technician",
                      status:
                        caseDetail.status === "in_queue"
                          ? "in_progress"
                          : "done",
                    },
                    {
                      date: new Date().toISOString(),
                      condition: "Manufacturing",
                      treatment: "Processing",
                      status:
                        caseDetail.status === "in_progress"
                          ? "in_progress"
                          : "pending",
                    },
                    {
                      date: caseDetail.due_date || new Date().toISOString(),
                      condition: "Quality Check",
                      treatment: "Final Inspection",
                      status:
                        caseDetail.status === "completed" ? "done" : "pending",
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="mr-2" size={20} /> Case Items
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="border rounded-lg bg-white">
                  <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Type
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="w-32 text-xs py-0.5 pl-4 pr-0">
                          Tooth
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="text-xs py-0.5 pl-4 pr-0">
                          Material/Item
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="text-xs py-0.5 pl-4 pr-0">
                          Shade
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="text-xs py-0.5 pl-4 pr-0">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail.products?.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            <span
                              className="px-2 py-1 rounded text-white"
                              style={{
                                backgroundColor:
                                  TYPE_COLORS[
                                    product.product_type
                                      ?.name as keyof typeof TYPE_COLORS
                                  ] || TYPE_COLORS.Other,
                              }}
                            >
                              {product.product_type?.name ?? "Null"}
                            </span>
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator
                              orientation="vertical"
                              className="h-full"
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            {product.teethProduct.tooth_number.length > 1
                              ? formatTeethRange(
                                  product.teethProduct.tooth_number
                                )
                              : product.teethProduct.tooth_number[0]}
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator
                              orientation="vertical"
                              className="h-full"
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            {product.material?.name || "-"}
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator
                              orientation="vertical"
                              className="h-full"
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            <div className="space-y-1">
                              {product.teethProduct.body_shade?.name && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Body:</span>
                                  <span>
                                    {product.teethProduct.body_shade.name}
                                  </span>
                                </div>
                              )}
                              {product.teethProduct.gingival_shade?.name && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Gingival:
                                  </span>
                                  <span>
                                    {product.teethProduct.gingival_shade.name}
                                  </span>
                                </div>
                              )}
                              {product.teethProduct.occlusal_shade?.name && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Occlusal:
                                  </span>
                                  <span>
                                    {product.teethProduct.occlusal_shade.name}{" "}
                                  </span>
                                </div>
                              )}
                              {product.teethProduct.stump_shade_id?.name && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Stump:</span>
                                  <span>
                                    {product.teethProduct.stump_shade_id.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator
                              orientation="vertical"
                              className="h-full"
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            {product.teethProduct?.notes ? (
                              <div className="max-w-xs">
                                <p className="text-gray-600 line-clamp-2">
                                  {product.teethProduct?.notes}
                                </p>
                                {product.teethProduct?.notes.length > 100 && (
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <Button
                                        variant="link"
                                        className="h-auto p-0 text-xs text-blue-500 hover:text-blue-600"
                                      >
                                        Show more
                                      </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent
                                      className="w-80 p-4"
                                      align="start"
                                      side="left"
                                    >
                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">
                                          Product Notes
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {product.notes}
                                        </p>
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <FileText className="mr-2" size={20} /> Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="border rounded-lg bg-white">
                  <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-32 text-xs py-0.5 pl-4 pr-0">
                          Tooth
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="text-xs py-0.5 pl-4 pr-0">
                          Billing Item
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Quantity
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Price
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Discount
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Final Price
                        </TableHead>
                        <TableHead className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableHead>
                        <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail?.products &&
                        caseDetail?.products?.map((product, index) => {
                          const price = product?.discounted_price?.price || 0;
                          const discount =
                            product?.discounted_price?.discount || 0;
                          const finalPrice =
                            product?.discounted_price?.final_price || price;
                          const quantity = product?.tooth_number?.length || 1;
                          const subtotal = finalPrice * quantity;

                          return (
                            <TableRow key={index}>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                {product.tooth_number?.length > 1
                                  ? formatTeethRange(
                                      product.teethProduct?.tooth_number
                                    )
                                  : product.teethProduct?.tooth_number[0]}
                              </TableCell>
                              <TableCell className="w-[1px] p-0">
                                <Separator
                                  orientation="vertical"
                                  className="h-full"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                {product.name || "-"}
                              </TableCell>
                              <TableCell className="w-[1px] p-0">
                                <Separator
                                  orientation="vertical"
                                  className="h-full"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                {product?.discounted_price?.quantity || "-"}
                              </TableCell>
                              <TableCell className="w-[1px] p-0">
                                <Separator
                                  orientation="vertical"
                                  className="h-full"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                ${product?.discounted_price?.price}
                              </TableCell>
                              <TableCell className="w-[1px] p-0">
                                <Separator
                                  orientation="vertical"
                                  className="h-full"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                {discount > 0 ? (
                                  <span className="text-green-600">
                                    {product.discounted_price.discount.toFixed(
                                      2
                                    )}
                                    %
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="w-[1px] p-0">
                                <Separator
                                  orientation="vertical"
                                  className="h-full"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0 font-medium">
                                $
                                {product?.discounted_price?.final_price.toFixed(
                                  2
                                )}
                              </TableCell>
                              <TableCell className="w-[1px] p-0">
                                <Separator
                                  orientation="vertical"
                                  className="h-full"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 pl-4 pr-0 font-medium">
                                ${subtotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      <TableRow className="border-t border-gray-200 bg-gray-50 w-full">
                        <TableCell className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableCell>

                        <TableCell className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableCell>
                        <TableCell className="w-[1px] p-0">
                          <Separator
                            orientation="vertical"
                            className="h-full"
                          />
                        </TableCell>
                        <TableCell
                          colSpan={9}
                          className="text-xs py-2 pl-4 pr-0 text-right"
                        >
                          Total:
                        </TableCell>
                        <TableCell className="text-xs py-2 pl-4 pr-0 font-medium">
                          $
                          {caseDetail.products
                            ?.reduce((total, product) => {
                              const finalPrice =
                                product.discounted_price?.final_price ||
                                product.price ||
                                0;
                              return total + finalPrice;
                            }, 0)
                            .toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="mr-2" size={20} /> Products
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600">Occlusal Details</p>
                    <p className="font-medium">
                      {caseDetail?.case_products?.length > 0
                        ? caseDetail.custom_occlusal_details
                        : caseDetail.case_products?.[0]?.occlusal_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contact Type</p>
                    <p className="font-medium">
                      {caseDetail.custom_contact_details
                        ? caseDetail.custom_contact_details
                        : caseDetail.contact_type}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="mb-4">
                    <p className="text-gray-600">Lab Notes</p>
                    <p className="font-medium">
                      {caseDetail.lab_notes || "No notes"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600">Technician Notes</p>
                    <p className="font-medium">
                      {caseDetail?.technician_notes ||
                        "No technician notes"}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600">Other Items</p>
                  <p className="font-medium">
                    {caseDetail?.otherItems || "No notes"}
                  </p>
                </div>
                {caseDetail.teethProducts?.map((product, index) => (
                  <div
                    key={index}
                    className="border-b last:border-b-0 pb-4 mb-4"
                  >
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <CircleDot className="mr-2" size={16} /> Selected Teeth
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="font-medium mb-2">
                            Tooth #
                            {product.tooth_number.length > 1
                              ? product.tooth_number
                                  .map((i) => `${i}`)
                                  .join(", ")
                              : product.tooth_number[0]}
                          </p>
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Body Shade:
                              </span>
                              <span>{product.body_shade?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Gingival Shade:
                              </span>
                              <span>
                                {product.gingival_shade?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Occlusal Shade:
                              </span>
                              <span>
                                {product.occlusal_shade?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Stump Shade:
                              </span>
                              <span>
                                {product.stump_shade_id?.name || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardContent className="py-2 px-3">
                <Accordion type="single" defaultValue="doctor-info" collapsible>
                  <AccordionItem value="doctor-info" className="border-none">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <span className="font-semibold">
                          Doctor Information
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Client Name</p>
                          <p className="font-medium">
                            {caseDetail.doctor?.client?.client_name ||
                              "Unknown Clinic"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Doctor Name</p>
                          <p className="font-medium">
                            {caseDetail.doctor?.name || "Unknown Doctor"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">
                            {caseDetail.doctor?.client?.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2 px-3">
                <Accordion
                  type="single"
                  defaultValue="instructions"
                  collapsible
                >
                  <AccordionItem value="instructions" className="border-none">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <span className="font-semibold">Instructions</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Occlusal Type</p>
                          <p className="font-medium">
                            {caseDetail.custom_occulusal_details ||
                              caseDetail.occlusal_type ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact Type</p>
                          <p className="font-medium">
                            {caseDetail.custom_contact_details ||
                              caseDetail.contact_type ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pontic Type</p>
                          <p className="font-medium">
                            {caseDetail.custom_pontic_details ||
                              caseDetail.pontic_type ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2 px-3">
                <Accordion type="single" collapsible>
                  <AccordionItem value="notes" className="border-none">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <span className="font-semibold">Case Notes</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Lab Notes</p>
                          <p className="font-medium">
                            {caseDetail.lab_notes || "No lab notes"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Technician Notes
                          </p>
                          <p className="font-medium">
                            {caseDetail?.technician_notes ||
                              "No technician notes"}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2 px-3">
                <Accordion type="single" collapsible>
                  <AccordionItem value="enclosed" className="border-none">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Enclosed Items</span>
                          <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-gray-50">
                            {
                              Object.values(
                                caseDetail.enclosed_items || {}
                              ).filter(Boolean).length
                            }
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: "impression", label: "Impression" },
                          {
                            key: "biteRegistration",
                            label: "Bite Registration",
                          },
                          { key: "photos", label: "Photos" },
                          { key: "jig", label: "Jig" },
                          { key: "opposingModel", label: "Opposing Model" },
                          { key: "articulator", label: "Articulator" },
                          {
                            key: "returnArticulator",
                            label: "Return Articulator",
                          },
                          { key: "cadcamFiles", label: "CAD/CAM Files" },
                          {
                            key: "consultRequested",
                            label: "Consult Requested",
                          },
                        ].map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center gap-2"
                          >
                            {caseDetail?.enclosed_items?.[
                              item.key as keyof typeof caseDetail.enclosed_items
                            ] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2 px-3">
                <Accordion type="single" collapsible>
                  <AccordionItem value="attachments" className="border-none">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Attachments</span>
                          <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-gray-50">
                            {/* {caseDetail.case_files?.length || 0} */}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-sm text-gray-500">
                        Files and photos will be implemented when DB is
                        connected
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
