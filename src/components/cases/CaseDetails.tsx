import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  User,
  FileText,
  Camera,
  Package,
  CircleDot,
  MoreHorizontal,
  Printer,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  Case,
  CaseProduct,
  CaseProductTooth,
  ShadeData,
} from "@/types/supabase";
import CaseProgress from "./CaseProgress";
import PhotoUpload from "./PhotoUpload";
import QRCodeScanner from "./QRCodeScanner";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define TypeScript interfaces for our data structure
interface CaseFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

interface ExtendedCase extends Case {
  client: {
    id: string;
    client_name: string;
    phone: string;
  };
  doctor?: {
    id: string;
    name: string;
    client: {
      id: string;
      client_name: string;
      phone: string;
    };
  };
  case_products?: CaseProduct[];
}

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseDetail, setCaseDetail] = useState<ExtendedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setError("No case ID provided");
      setLoading(false);
      return;
    }

    const fetchCaseData = async () => {
      try {
        console.log("Fetching case data for ID:", caseId);

        // Step 1: Fetch case details
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
              due_date,
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

        console.log("Successfully fetched case data:", caseData);

        // Extract products_id array and caseProductId
        const productsIdArray = caseData?.product_ids[0]?.products_id;
        const caseProductId = caseData?.product_ids[0]?.id;
        console.log(productsIdArray, "productsIdArray");
        console.log(caseProductId, "caseProductId");

        let products = [];
        let teethProducts = [];
        let discountedPrices = [];

        if (productsIdArray?.length > 0) {
          // Step 2: Fetch products based on products_id array
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
            console.error("Error fetching products:", productsError);
            setError(productsError.message);
          } else {
            console.log("Successfully fetched products:", productData);
            products = productData;
          }

          // Step 3: Fetch discounted price data for products
          const { data: discountedPriceData, error: discountedPriceError } =
            await supabase
              .from("discounted_price")
              .select(
                `
                product_id,
                discount,
                final_price,
                price
              `
              )
              .in("product_id", productsIdArray);

          if (discountedPriceError) {
            console.error(
              "Error fetching discounted prices:",
              discountedPriceError
            );
            setError(discountedPriceError.message);
          } else {
            console.log(
              "Successfully fetched discounted prices:",
              discountedPriceData
            );
            discountedPrices = discountedPriceData;
            console.log(discountedPrices, "discountedPrices");
          }
        } else {
          console.log("No products associated with this case.");
        }

        if (caseProductId) {
          // Step 4: Fetch case_teeth_products based on caseProductId
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
                tooth_number
              `
              )
              .eq("case_product_id", caseProductId);

          if (teethProductsError) {
            console.error("Error fetching teeth products:", teethProductsError);
            setError(teethProductsError.message);
          } else {
            console.log(
              "Successfully fetched teeth products:",
              teethProductData
            );
            teethProducts = teethProductData;
          }
        } else {
          console.log("No caseProductId found for fetching teeth products.");
        }

        // Step 5: Combine the products with their respective discounted price data
        const productsWithDiscounts = products.map((product: any) => {
          // Find the matching discounted price for the product
          const discountedPrice = discountedPrices.find(
            (discount: any) => discount.product_id === product.id
          );
          console.log(discountedPrice, "discountedPrice");
          // Combine the product data with the discounted price details
          return {
            ...product,
            discounted_price: discountedPrice,
          };
        });

        // Step 6: Combine case details, products, and teethProducts
        const caseDetailWithProducts = {
          ...caseData,
          products: productsWithDiscounts,
          teethProducts,
        };
        setCaseDetail(caseDetailWithProducts);
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
    // Implement stage completion logic here
    console.log(`Completing stage: ${stageName}`);
  };

  const handlePhotoUpload = async (file: File) => {
    // Implement photo upload logic here
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
  console.log(caseDetail, "caseDetail.qr_code");
  return (
    <div className="w-full">
      {/* Full-width Header */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-16 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <QRCodeSVG
                  value={caseDetail.qr_code}
                  size={64}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">
                  {caseDetail.patient_name
                    ? caseDetail.patient_name
                    : "Unknown Patient"}
                </h1>
                <div className="mt-2 flex items-center space-x-4 text-gray-500">
                  <span>Case ID: {caseDetail?.id.slice(0, 8)}...</span>
                  <span>
                    {caseDetail?.doctor?.name || "Unknown Doctor"},
                    {caseDetail?.doctor?.client?.client_name ||
                      "Unknown Clinic"}
                  </span>
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
                    {new Date(caseDetail.received_date).toLocaleDateString()}
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

      {/* Main Content with max-width container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Basic Info and Products */}
          <div className="md:col-span-2 space-y-6">
            {/* Case Progress Stepper */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CircleDot className="mr-2" size={20} /> Case Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-50 rounded-md">
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
                      date:
                        caseDetail.received_date || new Date().toISOString(),
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
                      date: caseDetail.ship_date || new Date().toISOString(),
                      condition: "Quality Check",
                      treatment: "Final Inspection",
                      status:
                        caseDetail.status === "completed" ? "done" : "pending",
                    },
                  ]}
                />
              </CardContent>
            </Card>

            {/* Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Clock className="mr-2" size={20} /> Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Current Status:</span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium capitalize"
                      style={{
                        backgroundColor:
                          caseDetail.status === "in_progress"
                            ? "#EFF6FF"
                            : "#F3F4F6",
                        color:
                          caseDetail.status === "in_progress"
                            ? "#1D4ED8"
                            : "#374151",
                      }}
                    >
                      {caseDetail.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="mr-2" size={20} /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Patient Name</p>
                    <p className="font-medium">{caseDetail.patient_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">PAN Number</p>
                    <p className="font-medium">{caseDetail.pan_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RX Number</p>
                    <p className="font-medium">{caseDetail.rx_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Billing Type</p>
                    <p className="font-medium capitalize">
                      {caseDetail.billing_type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Clock className="mr-2" size={20} /> Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600">Received Date</p>
                    <p className="font-medium">
                      {new Date(caseDetail.received_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-medium">
                      {new Date(caseDetail.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ship Date</p>
                    <p className="font-medium">
                      {caseDetail.ship_date
                        ? new Date(caseDetail.ship_date).toLocaleDateString()
                        : "Not shipped"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="mr-2" size={20} /> Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600">Occlusal Details</p>
                    <p className="font-medium">
                      {caseDetail.custom_occulusal_details
                        ? caseDetail.custom_occulusal_details
                        : caseDetail.occlusal_type}
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
                      {caseDetail?.lab_notes || "No notes"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600">Technician Notes</p>
                    <p className="font-medium">
                      {caseDetail?.technician_notes || "No notes"}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600">Other Items</p>
                  <p className="font-medium">
                    {caseDetail?.otherItems || "No notes"}
                  </p>
                </div>{" "}
                {caseDetail.teethProducts?.map((product) => (
                  <div
                    key={product.id}
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
                            {/* {Object.entries(product.shades).map( */}
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Body Shade:
                              </span>
                              <span>{product.body_shade.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Gingival Shade:
                              </span>
                              <span>
                                {product.gingival_shade.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Occlusal Shade:
                              </span>
                              <span>
                                {product.occlusal_shade.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                Stump Shade:
                              </span>
                              <span>
                                {product.stump_shade_id.name || "N/A"}
                              </span>
                            </div>

                            {/* )} */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            {/* Doctor Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="mr-2" size={20} /> Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {caseDetail.doctor?.name || "Unknown Doctor"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {caseDetail.doctor?.client?.client_name ||
                        "Unknown Clinic"}
                    </p>
                  </div>
                  {caseDetail.doctor?.client?.phone && (
                    <div className="flex items-center text-gray-600">
                      <p className="text-sm">
                        Phone: {caseDetail.doctor.client.phone}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Files Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <FileText className="mr-2" size={20} /> Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseDetail.case_files && caseDetail.case_files.length > 0 ? (
                    <div className="space-y-2">
                      {caseDetail.case_files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                        >
                          <span className="text-sm text-gray-600">
                            {file.file_name}
                          </span>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No files uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Camera className="mr-2" size={20} /> Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PhotoUpload caseId={caseId} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
