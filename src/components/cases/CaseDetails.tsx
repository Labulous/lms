import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
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
import {
  Case,
  CaseProduct,
  ToothInfo,
  CaseStatus,
  CASE_STATUS_DESCRIPTIONS,
  WorkingStationLog,
  WorkingStationTypes,
  WorkstationForm,
} from "@/types/supabase";
import CaseProgress, { CaseStep } from "./CaseProgress";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
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
import InvoiceActions from "@/components/cases/InvoiceActions";
import InvoicePreviewModal from "@/components/invoices/InvoicePreviewModal";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatDateWithTime } from "@/lib/formatedDate";
import { FileWithStatus } from "./wizard/steps/FilesStep";
import PrintHandler from "./print/PrintHandler";
import { PAPER_SIZES } from "./print/PrintHandler";

interface CaseFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface Product {
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

export interface DiscountedPrice {
  product_id: string;
  discount: number;
  final_price: number;
  price: number;
}

interface Invoice {
  id: string;
  case_id: string;
  amount: number;
  status: string;
  due_date: string;
  items?: any[];
  discount?: number;
  discount_type?: string;
  tax?: number;
  notes?: string;
}

export interface ExtendedCase {
  id: string;
  created_at: string;
  received_date: string | null;
  ship_date: string | null;
  status: CaseStatus;
  patient_name: string;
  due_date: string;
  case_number: string;
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
  case_products: CaseProduct[];
  product_ids: {
    id: string;
    products_id: string[];
  }[];
  lab_notes: string;
  otherItems: string;
  custom_contact_details: string;
  custom_occulusal_details: string;
  custom_pontic_details: string;
  custom_occlusal_details: string;
  occlusal_type: string;
  pontic_type: string;
  attachements: string[];
  contact_type: string;
  appointment_date: string;
  instruction_notes: string | null;
  invoice_notes: string;
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
  tag: {
    name: string;
    id: string;
  };
  invoice: {
    id: string;
    case_id: string;
    amount: number;
    status: string;
    due_date: string;
    discount?: string;
    tax?: string;
    notes?: string;
    items?: any;
    discount_type?: string;
  }[];
  teethProducts?: {
    tooth_number: number[];
    body_shade?: { name: string };
    gingival_shade?: { name: string };
    occlusal_shade?: { name: string };
    stump_shade_id?: { name: string };
  }[];
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
  const navigate = useNavigate();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [activePrintType, setActivePrintType] = useState<string | null>(null);
  const [selectedPaperSize, setSelectedPaperSize] =
    useState<keyof typeof PAPER_SIZES>("LETTER");

  const [stepsData, setStepData] = useState<CaseStep[] | []>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>(null);
  const [workstationLoading, setWorkstationLoading] = useState<boolean>(false);
  const [workStationTypes, setWorkStationTypes] = useState<
    WorkingStationTypes[] | []
  >([]);
  const { user } = useAuth();
  const [workstationForm, setWorkStationForm] = useState<WorkstationForm>({
    created_by: user?.id as string,
    technician_id: user?.role === "technician" ? user.id : "",
    custom_workstation_type: "",
    status: "in_progress",
    started_notes: "",
    started_at: "jan 200 ",
    completed_at: "",
    issue_reported_at: "",
    workstation_type_id: "",
    case_id: caseId as string,
  });
  console.log(workstationLoading, "loading");
  const getWorkStationDetails = async (case_ceated_at: string) => {
    try {
      const lab = await getLabIdByUserId(user?.id as string);
      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      const { data: workStationData, error: workStationError } = await supabase
        .from("workstation_log")
        .select(
          `
            id,
         technician:users!technician_id (id, name),
         type:workstation_types!workstation_type_id (
         id,
         name
         ),
         status,
         started_at,
         completed_at,
         issue_reported_at,
         attachements,
         custom_workstation_type,
         started_notes,
         completed_notes,
         issue_reported_notes,
         created_by: users!created_by (
         id,
         name
         )
        `
        )
        .eq("case_id", caseId);
      const { data: worksationTypes, error: worksationTypesErrors } =
        await supabase
          .from("workstation_types")
          .select(
            `
        id,
        name,
        is_default,
        is_active,
        created_at
        `
          )
          .eq("lab_id", lab.labId);
      if (workStationError) {
        setError(workStationError?.message || "");
      } else {
        console.log(workStationData, "workStationData");

        let workStationDataApi: any = workStationData;
        const steps = [
          {
            date: case_ceated_at || new Date().toISOString(),
            technician: {
              name: "System",
              id: "",
            },
            status: "completed" as
              | "in_progress"
              | "completed"
              | "issue_reported",
            notes: "Case has been created and is ready for Manufacturing.",
          },
          ...workStationDataApi.map((item: any) => {
            return {
              date: item.started_at,
              id: item.id,
              workstation_type_id: item?.type?.id || "",
              workstation_type_name: item?.type?.name || "",
              status: item.status as
                | "in_progress"
                | "completed"
                | "issue_reported",

              notes: item.notes,
              started_notes: item.started_notes,
              completed_notes: item.completed_notes,
              issue_reported_notes: item.issue_reported_notes,
              custom_workstation_type: item.custom_workstation_type,
              started_at: item.started_at,
              completed_at: item.completed_at,
              issue_reported_at: item.issue_reported_at,
              technician: {
                name: item.technician.name,
                id: item.technician.id,
              },
              created_by: {
                name: item.created_by.name,
              },
              isEditOn: false,
              files: item.attachements,
            };
          }),
        ];
        setStepData(steps);
      }
      if (worksationTypesErrors) {
        setError(worksationTypesErrors?.message || "");
      } else {
        console.log(workStationData, "workStationData");
        const customWorkstationType: WorkingStationTypes = {
          id: "custom-id", // You can generate a unique ID if needed
          name: "custom",
          is_default: false, // or true depending on your logic
          is_active: true, // or false depending on your logic
          created_at: new Date().toISOString(),
        };
        const updatedWorkstationTypes = [
          ...worksationTypes,
          customWorkstationType,
        ];

        setWorkStationTypes(updatedWorkstationTypes);
      }
    } catch (err) {
      console.log(err, "erro");
    } finally {
    }
  };
  useEffect(() => {
    if (!caseId) {
      setError("No case ID provided");
      setLoading(false);
      return;
    }
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        const lab = await getLabIdByUserId(user?.id as string);
        if (!lab?.labId) {
          console.error("Lab ID not found.");
          return;
        }
        setLab(lab);

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
              attachements,
              case_number,
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
              tag:working_tags!pan_tag_id (
                name,
                color
              ),
              rx_number,
              received_date,
              invoice_notes,
              isDueDateTBD,
              appointment_date,
              instruction_notes,
              otherItems,
              lab_notes,
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
              created_by:users!created_by (
                name,
                id
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
        let caseDataApi: any = caseData;
        setCaseDetail(caseDataApi);
        getWorkStationDetails(caseData?.created_at);

        if (caseData.product_ids?.[0]?.products_id) {
          const productsIdArray = caseData.product_ids[0].products_id;
          const caseProductId = caseData.product_ids[0].id;

          // Fetch products
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
              .in("id", productsIdArray)
              .eq("lab_id", lab.labId);

            if (productsError) {
              setError(productsError.message);
              return;
            }

            // Fetch discounted prices
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
                .eq("case_id", caseId);

            if (discountedPriceError) {
              console.error(
                "Error fetching discounted prices:",
                discountedPriceError
              );
              setError(discountedPriceError.message);
              return;
            }

            // Fetch teeth products if case product ID exists
            let teethProducts: any = [];
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
                    product_id,
                    custom_body_shade,
                    custom_occlusal_shade,
                    custom_gingival_shade,
                    custom_stump_shade,
                    type
                  `
                  )
                  .eq("case_product_id", caseProductId);

              if (teethProductsError) {
                setError(teethProductsError.message);
                return;
              }
              teethProducts = teethProductData;
            }

            // Combine all product data
            const productsWithDiscounts = productData.map((product: any) => {
              const discountedPrice = discountedPriceData.find(
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
          }
        }
      } catch (error) {
        console.error("Error fetching case data:", error);
        toast.error("Failed to load case details");
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  const handleCompleteStage = async (stageName: string) => {
    console.log(`Completing stage: ${stageName}`);
  };

  const handlePhotoUpload = async (file: File) => {
    console.log(`Uploading photo: ${file.name}`);
  };

  const handlePrint = (type: string) => {
    if (!caseDetail) return;

    // Create the preview URL with state encoded in base64
    const previewState = {
      type,
      paperSize: selectedPaperSize,
      caseData: {
        id: caseDetail.id,
        patient_name: caseDetail.patient_name,
        case_number: caseDetail.case_number,
        qr_code: `https://app.labulous.com/cases/${caseDetail.id}`,
        client: caseDetail.client,
        doctor: caseDetail.doctor,
        created_at: caseDetail.created_at,
        due_date: caseDetail.due_date,
        tag: caseDetail.tag,
      },
    };

    const stateParam = encodeURIComponent(btoa(JSON.stringify(previewState)));
    const previewUrl = `${window.location.origin}/print-preview?state=${stateParam}`;
    window.open(previewUrl, "_blank");
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

  const handleCreateNewWorkStation = () => {
    const newCreateStep = {
      date: new Date().toISOString(),
      technician: {
        name: user?.role === "technician" ? user.name : "",
        id: "",
      },
      isNew: true,
      status: workstationForm.status as
        | "in_progress"
        | "completed"
        | "issue_reported",
      notes: workstationForm.started_notes,
    };

    setStepData((steps) => [...steps, newCreateStep]);
  };

  const handleSubmitWorkstation = async () => {
    // Validation for required fields
    if (
      !workstationForm.case_id ||
      !workstationForm.status ||
      !workstationForm.technician_id ||
      !workstationForm.created_by ||
      !workstationForm.workstation_type_id ||
      !workstationForm.started_notes
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Create the dataToFeed object
    const dataToFeed = {
      case_id: workstationForm.case_id,
      lab_id: lab?.labId, // labId is optional but should be checked if necessary
      status: workstationForm.status,
      started_notes: workstationForm.started_notes, // notes can be empty
      technician_id: workstationForm.technician_id,
      created_by: workstationForm.created_by,
      started_at: new Date().toISOString(), // Valid timestamp
      workstation_type_id:
        workstationForm.workstation_type_id === "custom-id"
          ? null
          : workstationForm.workstation_type_id,
      custom_workstation_type: workstationForm.custom_workstation_type
        ? workstationForm.custom_workstation_type
        : null, // Optional field
      attachements: selectedFiles.map((item) => item.url),
    };
    setWorkstationLoading(true);
    try {
      const { data: insertWorkstation, error: insertError } = await supabase
        .from("workstation_log")
        .insert(dataToFeed)
        .select("*");

      if (insertError) {
        toast.error("Failed to Insert New Workstation!");
        setWorkstationLoading(false);
      } else {
        toast.success("Workstation inserted successfully!");

        const { error: updateError } = await supabase
          .from("cases")
          .update({ status: "in_progress" })
          .eq("id", caseId);

        if (updateError) {
          toast.error(
            "Workstation has been created but failed to update the case"
          );
        }
        toast.success("Updated case Successfully!");
        setWorkStationForm({
          created_by: user?.id as string,
          technician_id: user?.role === "technician" ? user.id : "",
          custom_workstation_type: "",
          status: "in_progress",
          started_notes: "",
          started_at: "",
          completed_at: "",
          issue_reported_at: "",
          workstation_type_id: "",
          case_id: caseId as string,
        });
        setStepData((prev) => prev.filter((item) => !item.isNew));
        getWorkStationDetails(caseDetail.created_at);

        setWorkstationLoading(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      setWorkstationLoading(false);
    }
  };
  console.log(caseDetail, "caseDetail");
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
                    <span className="text-sm text-gray-500">INV #:</span>
                    <span className="text-sm font-medium text-primary">
                      {caseDetail?.invoice.length > 0
                        ? caseDetail.case_number.replace(/^.{3}/, "INV")
                        : "N/A"}
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
                              "bg-neutral-500 text-neutral-500 hover:bg-neutral-500":
                                caseDetail.status === "in_queue",
                              "bg-blue-500 text-blue-500 hover:bg-blue-500":
                                caseDetail.status === "in_progress",
                              "bg-yellow-500 text-yellow-500 hover:bg-yellow-500":
                                caseDetail.status === "on_hold",
                              "bg-green-500 text-green-500 hover:bg-green-500":
                                caseDetail.status === "completed",
                              "bg-red-500 text-red-500 hover:bg-red-500":
                                caseDetail.status === "cancelled",
                            }
                          )}
                        >
                          {caseDetail.status.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {
                            CASE_STATUS_DESCRIPTIONS[
                              caseDetail.status as CaseStatus
                            ]
                          }
                        </p>
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
                    <Button variant="outline" size="sm" className="gap-2">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Paper Size
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onSelect={() => setSelectedPaperSize("LETTER")}
                        >
                          Letter (8.5 x 11")
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setSelectedPaperSize("LEGAL")}
                        >
                          Legal (8.5 x 14")
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setSelectedPaperSize("HALF")}
                        >
                          Half (5.5 x 8.5")
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handlePrint("qr-code")}>
                      QR Code Label
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handlePrint("lab-slip")}>
                      Lab Slip
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handlePrint("address-label")}
                    >
                      Address Label
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handlePrint("patient-label")}
                    >
                      Patient Label
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/cases/update?caseId=${caseDetail.id}`)
                      }
                    >
                      Edit Case
                    </DropdownMenuItem>
                    <DropdownMenuItem>Delete Case</DropdownMenuItem>
                    <DropdownMenuItem>Archive Case</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm">Complete</Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Received Date</span>
                  <span className="text-xs font-medium">
                    {formatDate(caseDetail.created_at)}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Due Date</span>
                  <span className="text-xs font-medium">
                    {formatDate(caseDetail.due_date)}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Ship Date</span>
                  <span className="text-xs font-medium">
                    {caseDetail.ship_date
                      ? formatDate(caseDetail.ship_date)
                      : "Not Shipped"}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Appointment</span>
                  <span className="text-xs font-medium">
                    {formatDateWithTime(caseDetail.appointment_date)}
                  </span>
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
                {stepsData.length > 0 && (
                  <CaseProgress
                    steps={stepsData}
                    caseDetail={caseDetail}
                    handleNewWorkstation={handleCreateNewWorkStation}
                    workstationForm={workstationForm}
                    setWorkStationForm={setWorkStationForm}
                    workStationTypes={workStationTypes}
                    handleSubmitWorkstation={handleSubmitWorkstation}
                    setSteps={setStepData}
                    isLoading={workstationLoading}
                    setLoading={setWorkstationLoading}
                    getWorkStationDetails={getWorkStationDetails}
                    caseId={caseId as string}
                    caseCreatedAt={caseDetail.created_at}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                  />
                )}
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
                                    product?.product_type
                                      ?.name as keyof typeof TYPE_COLORS
                                  ] || TYPE_COLORS.Other,
                              }}
                            >
                              {product?.product_type?.name ?? "Null"}
                            </span>
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator
                              orientation="vertical"
                              className="h-full"
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            {product?.teethProduct?.tooth_number.length >= 1
                              ? formatTeethRange(
                                  product.teethProduct.tooth_number
                                )
                              : null}
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
                              {/* Body shade */}
                              {product?.teethProduct?.body_shade?.name ||
                              product?.teethProduct?.custom_body_shade ? (
                                <p>
                                  <div className="flex gap-2">
                                    <span className="text-gray-500">Body:</span>
                                    <span>
                                      {product?.teethProduct
                                        ?.custom_body_shade ||
                                        product?.teethProduct?.body_shade?.name}
                                    </span>
                                  </div>
                                </p>
                              ) : null}

                              {/* Gingival shade */}
                              {product?.teethProduct?.gingival_shade?.name ||
                              product?.teethProduct?.custom_gingival_shade ? (
                                <p>
                                  <div className="flex gap-2">
                                    <span className="text-gray-500">
                                      Gingival:
                                    </span>
                                    <span>
                                      {product?.teethProduct
                                        ?.custom_gingival_shade ||
                                        product?.teethProduct?.gingival_shade
                                          ?.name}
                                    </span>
                                  </div>
                                </p>
                              ) : null}

                              {/* Occlusal shade */}
                              {product?.teethProduct?.occlusal_shade?.name ||
                              product?.teethProduct?.custom_occlusal_shade ? (
                                <p>
                                  <div className="flex gap-2">
                                    <span className="text-gray-500">
                                      Occlusal:
                                    </span>
                                    <span>
                                      {product?.teethProduct
                                        ?.custom_occlusal_shade ||
                                        product?.teethProduct?.occlusal_shade
                                          ?.name}
                                    </span>
                                  </div>
                                </p>
                              ) : null}

                              {/* Stump shade */}
                              {product?.teethProduct?.custom_stump_shade ||
                              product?.teethProduct?.stump_shade_id ? (
                                <p>
                                  <div className="flex gap-2">
                                    <span className="text-gray-500">
                                      Stump:
                                    </span>
                                    <span>
                                      {product?.teethProduct
                                        ?.custom_stump_shade ||
                                        product?.teethProduct?.stump_shade_id
                                          ?.name}
                                    </span>
                                  </div>
                                </p>
                              ) : null}
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
                  {caseDetail?.custom_occlusal_details ? (
                    <div>
                      <p className="text-gray-600">Occlusal Details</p>
                      <p className="font-medium">
                        {caseDetail.custom_occlusal_details}
                      </p>
                    </div>
                  ) : null}

                  {caseDetail.custom_contact_details ? (
                    <div>
                      <p className="text-gray-600">Contact Type</p>
                      <p className="font-medium">
                        {caseDetail.custom_contact_details}
                      </p>
                    </div>
                  ) : null}
                  <div className="mb-4">
                    <p className="text-gray-600">Lab Notes</p>
                    <p className="font-medium">
                      {caseDetail.lab_notes || "No notes"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600">Invoice Notes</p>
                    <p className="font-medium">
                      {caseDetail?.invoice_notes || "No Invoice notes"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600">Instruction Notes</p>
                    <p className="font-medium">
                      {caseDetail?.instruction_notes || "No Instruction notes"}
                    </p>
                  </div>
                  {caseDetail.custom_pontic_details ? (
                    <div>
                      <p className="text-gray-600">Contact Type</p>
                      <p className="font-medium">
                        {caseDetail.custom_pontic_details}
                      </p>
                    </div>
                  ) : null}
                </div>

                {caseDetail.teethProducts?.map(
                  (
                    product: {
                      tooth_number: number[];
                      body_shade?: { name: string };
                      gingival_shade?: { name: string };
                      occlusal_shade?: { name: string };
                      stump_shade_id?: { name: string };
                    },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="border-b last:border-b-0 pb-4 mb-4"
                    >
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <CircleDot className="mr-2" size={16} /> Selected
                          Teeth
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
                  )
                )}
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
                            {caseDetail.occlusal_type || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact Type</p>
                          <p className="font-medium">
                            {caseDetail.contact_type || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pontic Type</p>
                          <p className="font-medium">
                            {caseDetail.pontic_type || "Not specified"}
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
                            Invoices Notes
                          </p>
                          <p className="font-medium">
                            {caseDetail?.invoice_notes || "No Invoices notes"}
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
                            {Object.values(
                              caseDetail.enclosed_items || {}
                            ).reduce((sum, value) => {
                              return typeof value === "number"
                                ? Number(sum) + value
                                : sum;
                            }, 0)}
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
                            <span className="text-sm">
                              {item.label}:{" "}
                              {caseDetail?.enclosed_items?.[
                                item.key as keyof typeof caseDetail.enclosed_items
                              ] || "Not Provided"}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="my-4">
                        <p className="text-gray-600">Other Items Note</p>
                        <p className="font-medium">
                          {caseDetail?.otherItems || "No notes"}
                        </p>
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
                            {caseDetail?.attachements?.length ?? 0}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-sm text-gray-500">Files and photos</p>

                      <div className="flex flex-col gap-2">
                        {caseDetail?.attachements?.map((item) => {
                          return (
                            <img
                              src={item}
                              height={200}
                              width={200}
                              alt="attachement"
                              className="p-2 border rounded-md"
                            />
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Invoice Preview Modal */}
      {caseDetail && (
        <InvoicePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setIsLoadingPreview(false);
          }}
          formData={{
            clientId: caseDetail.client?.id,
            items: caseDetail.invoice?.[0].items || [],
            discount: caseDetail.invoice?.[0].discount || 0,
            discountType: caseDetail.invoice?.[0].discount_type || "percentage",
            tax: caseDetail.invoice?.[0].tax || 0,
            notes: caseDetail.invoice?.[0].notes || "",
          }}
        />
      )}
      {activePrintType && caseDetail && (
        <PrintHandler
          type={activePrintType as any}
          paperSize={selectedPaperSize}
          caseData={{
            id: caseDetail.id,
            patient_name: caseDetail.patient_name,
            case_number: caseDetail.case_number,
            qr_code: `https://app.labulous.com/cases/${caseDetail.id}`,
            client: caseDetail.client,
            doctor: caseDetail.doctor,
            created_at: caseDetail.created_at,
            due_date: caseDetail.due_date,
            // tag: caseDetail.tag,
          }}
          onComplete={() => setActivePrintType(null)}
        />
      )}
    </div>
  );
};

export default CaseDetails;
