import React, { useState, useEffect, SetStateAction, useRef } from "react";
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
  labDetail,
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
import { getLabDataByUserId, getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatDateWithTime, formatDateWithTime_appt } from "@/lib/formatedDate";
import { FileWithStatus } from "./wizard/steps/FilesStep";
import PrintHandler from "./print/PrintHandler";
import { PAPER_SIZES } from "./print/PrintHandler";
import OnHoldModal from "./wizard/modals/OnHoldModal";
import ScheduleDelivery from "./wizard/modals/ScheduleDelivery";
import { EditInvoiceModal } from "../billing/EditInvoiceModal";
import { Invoice } from "@/data/mockInvoicesData";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";
import { LoadingState } from "@/pages/cases/NewCase";
import OnCancelModal from "./wizard/modals/onCancelModal";
import FilePreview from "./wizard/modals/FilePreview";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { calculateDueDate } from "@/lib/calculateDueDate";
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

export interface ExtendedCase {
  id: string;
  created_at: string;
  received_date?: string | null;
  ship_date: string | null;
  status: CaseStatus;
  patient_name: string;
  due_date: string;
  case_number: string;
  working_pan_name?: string;
  working_pan_color?: string;
  client: {
    id: string;
    client_name: string;
    phone: string;
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    account_number?: string;
  };
  doctor: {
    id: string;
    name: string;
    order: number;
    client: {
      id: string;
      client_name: string;
      phone: string;
    };
  };
  case_products?: CaseProduct[];
  product_ids: {
    id: string;
    products_id: string[];
  }[];
  otherItems: string;
  custom_contact_details: string;
  custom_occulusal_details: string;
  custom_pontic_details: string;
  custom_occlusal_details: string;
  margin_design_type: string;
  occlusion_design_type: string;
  common_services?: any[];
  is_appointment_TBD: string;
  alloy_type: string;
  custom_margin_design_type: string;
  custom_occlusion_design_type: string;
  custon_alloy_type: string;
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
    color: string;
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
    due_amount?: string;
    tax?: string;
    notes?: string;
    items?: any;
    discount_type?: string;
  }[];
  teethProduct?: {
    tooth_number: number[];
    pontic_teeth: number[];
    body_shade?: { name: string };
    gingival_shade?: { name: string };
    occlusal_shade?: { name: string };
    stump_shade_id?: { name: string };
  }[];
  labDetail?: labDetail;
  isDueDateTBD?: boolean;
  isDisplayAcctOnly?: boolean;
  isDisplayDoctorAcctOnly?: boolean;
  isHidePatientName?: boolean;
}

interface CaseDetailsProps {
  drawerMode?: boolean;
  caseId?: string;
  onNavigate?: (path: string) => void;
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

// const formatTeethRange = (teeth: number[]): string => {
//   if (!teeth || teeth.length === 0) return "";

//   const ranges: string[] = [];
//   let start = teeth[0];
//   let end = teeth[0];

//   for (let i = 1; i <= teeth.length; i++) {
//     if (i < teeth.length && teeth[i] === end + 1) {
//       end = teeth[i];
//     } else {
//       ranges.push(start === end ? start.toString() : `${start}-${end}`);
//       if (i < teeth.length) {
//         start = teeth[i];
//         end = teeth[i];
//       }
//     }
//   }

//   return ranges.join(", ");
// };

const CaseDetails: React.FC<CaseDetailsProps> = ({
  drawerMode,
  caseId: propCaseId,
  onNavigate,
}) => {
  const params = useParams<{ caseId: string }>();
  const routeCaseId = params.caseId;
  const activeCaseId = propCaseId || routeCaseId;

  const baseUrl = import.meta.env.VITE_BASE_URL; // ✅ Works in Vite
  const navigate = useNavigate();
  const safeNavigate = (path: string) => {
    if (drawerMode && onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };
  const [caseDetail, setCaseDetail] = useState<ExtendedCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [isApiLoad, setIsApiLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  let location = useLocation();
  const [editingInvoice, setEditingInvoice] = useState<ExtendedCase | null>(
    null
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [activePrintType, setActivePrintType] = useState<string | null>(null);
  const [onHoldModal, setOnHoldModal] = useState<boolean>(false);
  const [onCancelModal, setOnCancelModal] = useState<boolean>(false);
  const [services, setServices] = useState<any[]>([]);
  const [onHoldReason, setOnHoldReason] = useState<string | null>(null);
  const [invoicePreviewModalOpen, setInvoicePreviewModalOpen] =
    useState<boolean>(false);
  const [selectedPaperSize, setSelectedPaperSize] =
    useState<keyof typeof PAPER_SIZES>("LETTER");
  const [stepsData, setStepData] = useState<CaseStep[] | []>([]);
  const [lab, setLab] = useState<labDetail | null>(null);
  const [workstationLoading, setWorkstationLoading] = useState<boolean>(false);
  const [isScheduleModal, setIsScheduleModal] = useState<boolean>(false);
  const [isFilePreview, setIsFilePreview] = useState<boolean>(false);
  const [caseRefresh, setCaseRefresh] = useState<boolean>(false);
  const [files, setFiles] = useState<string[]>([]);
  const [loadingAgain, setLoadingAgain] = useState(true);
  const [workStationTypes, setWorkStationTypes] = useState<
    WorkingStationTypes[] | []
  >([]);
  const { user } = useAuth();

  const [loadingState, setLoadingState] = useState<LoadingState>({
    action: null,
    isLoading: false,
  });
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
    case_id: activeCaseId as string,
  });
  const fetchServices = async () => {
    const lab = await getLabDataByUserId(user?.id as string);
    if (!lab?.id) {
      console.error("Lab ID not found.");
      return;
    }
    if (!lab?.id) {
      console.log("No lab ID provided.");
      return;
    }
    const { data, error } = await supabase
      .from("services")
      .select("id,name,price,is_taxable")
      .eq("lab_id", lab.id);

    if (error) {
      console.error("Failed to fetch services:", error);
      return; // Early exit if error occurs
    }

    console.log(data, "datadata");
    setServices(data);
    if (data) {
      setCaseDetail((detail: any) => ({
        ...detail,
        products: detail?.products
          ? detail.products.map((item: any) => ({
            ...item,
            service: item.teethProduct?.additional_services_id
              ? data
                .filter(
                  (service) =>
                    Array.isArray(
                      item.teethProduct.additional_services_id
                    ) &&
                    item.teethProduct.additional_services_id.includes(
                      service.id
                    )
                )
                .map((service) => ({
                  id: service.id,
                  name: service.name,
                  price: service.price,
                }))[0]
              : [],
          }))
          : [],
      }));
    }
  };
  const getWorkStationDetails = async (case_ceated_at: string) => {
    try {
      const lab = await getLabDataByUserId(user?.id as string);
      if (!lab?.id) {
        console.error("Lab ID not found.");
        return;
      }
      setLab(lab);

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
        .eq("case_id", activeCaseId);

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
          .eq("lab_id", lab.id);
      if (workStationError) {
        setError(workStationError?.message || "");
      } else {
        console.log(workStationData, "workStationData");
        fetchServices();
        let previousPath =
          location?.state?.from || "No previous path available";
        console.log(previousPath, "previousPath");
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
      // fetchCaseData(true);
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

  // const {
  //   data: labIdData,
  //   error: labError,
  //   isLoading: isLabLoading,
  // } = useQuery(
  //   supabase.from("users").select("lab_id").eq("id", user?.id).single(),
  //   {
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //   }
  // );

  // if (labError) {
  //   return <div>Loading!!!</div>;
  // }

  const { data: caseDataa, error: caseError } = useQuery(
    activeCaseId
      ? supabase
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
        common_services,
        is_appointment_TBD,
        isDisplayAcctOnly,
        isDisplayDoctorAcctOnly,
        isHidePatientName,
        invoice:invoices!case_id (
          id,
          case_id,
          amount,
          status,
          due_amount,
          due_date
        ),
        client:clients!client_id (
          id,
          client_name,
          phone,
          street,
          city,
          state,
          zip_code,
          additional_lead_time,
          account_number
        ),
        doctor:doctors!doctor_id (
          id,
          name,
          order,
          client:clients!client_id (
            id,
            client_name,
            phone
          )
        ),
        tag:working_tags!working_tag_id (
          name,
          color
        ),
        working_pan_name,
        working_pan_color,
        rx_number,
        received_date,
        invoice_notes,
        isDueDateTBD,
        isDisplayAcctOnly,
        isDisplayDoctorAcctOnly,
        isHidePatientName,
        appointment_date,
        instruction_notes,
        otherItems,
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
        ),
         margin_design_type,
        occlusion_design_type,
        alloy_type,
        custom_margin_design_type,
        custom_occlusion_design_type,
        custon_alloy_type,
      discounted_price:discounted_price!id (
                id,
                product_id,
                discount,
                final_price,
                price,
                quantity,
                total,
                service_price,
                service_discount
          ),
        teethProduct: case_product_teeth!id (
          id,
          is_range,
          type,
          tooth_number,
          pontic_teeth,
          product_id,
          additional_services_id,
          services_discount,
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
             stump_shade:shade_options!stump_shade_id (
               name,
              category,
              is_active
                    ),
                  pontic_teeth,
                  notes,
                  product_id,
                  custom_body_shade,
                  custom_occlusal_shade,
                  custom_gingival_shade,
                  custom_stump_shade,
                  manual_body_shade,
                  manual_occlusal_shade,
                  manual_gingival_shade,
                  manual_stump_shade,
                  type,
            product:products!product_id (
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
          )
          )
      `
        )
        .eq("id", activeCaseId)
        .single()
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: true, // Refetch when the window is focused
      revalidateOnReconnect: true, // Refetch when the network is reconnected
    }
  );
  console.log(caseDataa, "caseDataaf");
  // Error handling
  if (caseError) {
    return <div>Error fetching case data: {caseError.message}</div>;
  }

  // const { data: servicesData, error: servicesError } = useQuery(
  //   caseDataa && activeCaseId && labIdData?.lab_id
  //     ? supabase
  //         .from("services")
  //         .select(
  //           `
  //      id,name,price,is_taxable
  //     `
  //         )
  //         .eq("lab_id", labIdData?.lab_id)
  //     : null, // Fetching a single record based on `activeCaseId`
  //   {
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //   }
  // );
  // if (servicesError) {
  //   return <div>Error fetching case data</div>;
  // }
  // if (!servicesData) {
  //   return <div>Case Details Loading....</div>;
  // }
  // console.log(servicesData, lab?.id, "servicesData");

  let caseItem: any = caseDataa;
  const caseDetailApi: ExtendedCase | null = caseItem
    ? {
      ...caseItem,
      labDetail: lab,
      custom_occlusal_details: caseDataa?.custom_occulusal_details,
      products: caseItem?.teethProduct.map((tp: any, index: number) => ({
        id: tp.product.id,
        name: tp.product.name,
        price: tp.product.price,
        service_price: tp.product.service_price,
        service_discount: tp.product.service_discount,
        lead_time: tp.product.lead_time,
        is_client_visible: tp.product.is_client_visible,
        is_taxable: tp.product.is_taxable,
        created_at: tp.product.created_at,
        updated_at: tp.product.updated_at,
        requires_shade: tp.product.requires_shade,
        material: tp.product.material,
        product_type: tp.product.product_type,
        common_services: caseItem?.common_services,
        billing_type: tp.product.billing_type,
        services_discount: caseItem?.teethProduct?.[index].services_discount,
        additional_services_id:
          caseItem?.teethProduct?.[index].additional_services_id,
        discounted_price: caseItem?.discounted_price[index],
        teethProduct: {
          id: tp.id,
          is_range: tp.is_range,
          tooth_number: tp.tooth_number,
          pontic_teeth: tp.pontic_teeth,
          product_id: tp.product_id,
          occlusal_shade: tp.occlusal_shade,
          body_shade: tp.body_shade,
          gingival_shade: tp.gingival_shade,
          stump_shade: tp.stump_shade,
          manual_occlusal_shade: tp.manual_occlusal_shade,
          manual_body_shade: tp.manual_body_shade,
          type: tp.type,
          manual_gingival_shade: tp.manual_gingival_shade,
          manual_stump_shade: tp.manual_stump_shade,
          custom_occlusal_shade: tp.custom_occlusal_shade,
          custom_body_shade: tp.custom_body_shade,
          custom_gingival_shade: tp.custom_gingival_shade,
          custom_stump_shade: tp.custom_stump_shade,
          custom_occlusal_details: tp.occlusal_shade,
          notes: tp.notes,
        },
      })),
    }
    : null;
  console.log(caseDetailApi, "caseDetailApi");
  const fetchCaseData = async (refetch?: boolean) => {
    try {
      setLoading(refetch ? false : true);
      const lab = await getLabDataByUserId(user?.id as string);
      if (!lab?.id) {
        console.error("Lab ID not found.");
        return;
      }

      setLab(lab);

      const handleFetchData = async () => {
        try {
          const { data: query, error } = await supabase
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
            common_services,
            case_number,
            isDisplayAcctOnly,
            isDisplayDoctorAcctOnly,
            isHidePatientName,
            invoice:invoices!case_id (
              id,
              case_id,
              amount,
              status,
              due_amount,
              due_date
            ),
            client:clients!client_id (
              id,
              client_name,
              phone,
              street,
              city,
              state,
              zip_code,
              account_number
            ),
            doctor:doctors!doctor_id (
              id,
              name,
              order,
              client:clients!client_id (
                id,
                client_name,
                phone
              )
            ),
            tag:working_tags!working_tag_id (
              name,
              color
            ),
            working_pan_name,
            working_pan_color,
            rx_number,
            received_date,
            invoice_notes,
            isDueDateTBD,
            appointment_date,
            instruction_notes,
            otherItems,
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
            ),
             margin_design_type,
            occlusion_design_type,
            alloy_type,
            custom_margin_design_type,
            custom_occlusion_design_type,
            custon_alloy_type,
          discounted_price:discounted_price!id (
                    id,
                    product_id,
                    discount,
                    final_price,
                    price,
                    quantity,
                    total
              ),
            teethProduct: case_product_teeth!id (
              id,
              is_range,
              additional_services_id,
              services_discount,
              type,
              tooth_number,
              pontic_teeth,
              product_id,
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
                 stump_shade:shade_options!stump_shade_id (
                   name,
                  category,
                  is_active
                        ),
                      pontic_teeth,
                      notes,
                      product_id,
                      custom_body_shade,
                      custom_occlusal_shade,
                      custom_gingival_shade,
                      custom_stump_shade,
                       manual_body_shade,
                  manual_occlusal_shade,
                  manual_gingival_shade,
                  manual_stump_shade,
                      type,
              product:products!product_id (
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
              )
              )
              `
            )
            .eq("lab_id", lab?.id)
            .eq("id", activeCaseId)
            .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
            .order("created_at", { ascending: false });

          if (error) {
            console.log("failed to fetch cases");
          }
          const arragedNewCases: ExtendedCase[] =
            query?.map((item: any) => {
              return {
                ...item,
                products: item.teethProduct.map((tp: any, index: number) => ({
                  id: tp.product.id,
                  additional_services_id: tp.additional_services_id,
                  services_discount: tp.services_discount,
                  name: tp.product.name,
                  price: tp.product.price,
                  lead_time: tp.product.lead_time,
                  is_client_visible: tp.product.is_client_visible,
                  is_taxable: tp.product.is_taxable,
                  created_at: tp.product.created_at,
                  updated_at: tp.product.updated_at,
                  requires_shade: tp.product.requires_shade,
                  material: tp.product.material,
                  product_type: tp.product.product_type,
                  billing_type: tp.product.billing_type,
                  discounted_price: item?.discounted_price?.[index],
                  teethProduct: {
                    id: tp.id,
                    is_range: tp.is_range,
                    tooth_number: tp.tooth_number,
                    pontic_teeth: tp.pontic_teeth,
                    product_id: tp.product_id,
                    occlusal_shade: tp.occlusal_shade,
                    body_shade: tp.body_shade,
                    gingival_shade: tp.gingival_shade,
                    stump_shade: tp.stump_shade,
                    manual_occlusal_shade: tp.manual_occlusal_shade,
                    manual_body_shade: tp.manual_body_shade,
                    type: tp.type,
                    manual_gingival_shade: tp.manual_gingival_shade,
                    manual_stump_shade: tp.manual_stump_shade,
                    custom_occlusal_shade: tp.custom_occlusal_shade,
                    custom_body_shade: tp.custom_body_shade,
                    custom_gingival_shade: tp.custom_gingival_shade,
                    custom_stump_shade: tp.custom_stump_shade,
                    custom_occlusal_details: tp.occlusal_shade,
                    notes: tp.notes,
                  },
                })),
              };
            }) || [];
          if (arragedNewCases) {
            setCaseDetail(arragedNewCases?.[0]);
            getWorkStationDetails(arragedNewCases?.[0]?.created_at);
            setFiles(arragedNewCases?.[0]?.attachements);
            console.log(arragedNewCases, "arragedNewCases");
          }
        } catch (err) {
          console.log("err");
        }
      };
      handleFetchData();
    } catch (error) {
      console.error("Error fetching case data:", error);
      toast.error("Failed to load case details");
    } finally {
      setLoading(false);
      setLoadingAgain(false);
      return () => {
        document.body.style.pointerEvents = "auto";
      };
    }
  };

  const hasRun = useRef(false);

  useEffect(() => {
    // Ensure `caseDetailApi` is not null or undefined and hasn't run before
    if (hasRun.current || !caseDetailApi) return;

    if (!activeCaseId) {
      if (caseDetailApi) {
        console.log(caseDetailApi, "caseDetailApi");
        setCaseDetail(caseDetailApi);
        fetchCaseData(true);
      }
      setError("No case ID provided");
      setLoading(false);
      setIsApiLoad(false);
      return;
    }

    if (activeCaseId) {
      getWorkStationDetails(caseDataa?.created_at);
      fetchCaseData(true);
    }
    console.log("use effect run");
    setCaseDetail(caseDetailApi);

    setCaseRefresh(false);

    hasRun.current = true; // Mark as executed
  }, [caseDetailApi]); // Dependency
  const handleCompleteStage = async (stageName: string) => {
    console.log(`Completing stage: ${stageName}`);
  };

  const handlePhotoUpload = async (file: File) => {
    console.log(`Uploading photo: ${file.name}`);
  };
  console.log(caseDetail, "case detail");
  const handlePrint = (type: string) => {
    if (!caseDetail) return;

    // Create the preview data
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
      caseDetails: [{ ...caseDetail, lab }],
    };

    // Store data in localStorage
    localStorage.setItem("printData", JSON.stringify(previewState));

    // Open the print preview page
    window.open(`${window.location.origin}/print-preview`, "_blank");
  };

  const handleDownloadFile = async (fileUrl: string) => {
    try {
      // If it's already a full URL, fetch it directly
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract filename from path
      const filename = fileUrl.split("/").pop()?.split("?")[0] || "download";
      // Decode the filename to handle special characters
      a.download = decodeURIComponent(filename);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
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
          <p className="text-gray-700">{"error"}</p>
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

  if (isApiLoad && !caseDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading case details....</p>
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
    setSelectedFiles([]);
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

    const updateDueDate = () => {
      const currentDate = new Date(); // Get the current date

      const nextMonthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      const formattedDate =
        nextMonthDate.toISOString().replace("T", " ").split(".")[0] + "+00";

      return formattedDate;
    };

    // Create the dataToFeed object
    const dataToFeed = {
      case_id: workstationForm.case_id,
      lab_id: lab?.id, // labId is optional but should be checked if necessary
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
          .eq("id", activeCaseId);

        if (updateError) {
          toast.error(
            "Workstation has been created but failed to update the case"
          );
        }
        const { error: updateInvoiceError } = await supabase
          .from("invoices")
          .update({ due_date: updateDueDate() })
          .eq("case_id", caseDetail.id);

        if (updateInvoiceError) {
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
          case_id: activeCaseId as string,
        });
        setStepData((prev) => prev.filter((item) => !item.isNew));
        getWorkStationDetails(caseDetail.created_at);
        fetchCaseData(true);
        setWorkstationLoading(false);
        updateBalanceTracking();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      setWorkstationLoading(false);
    }
  };

  const handleUpdateCaseStatus = async (status: string) => {
    if (status === "on_hold" && !onHoldReason) {
      toast.error("Please Provide the Reason For Holding a case");
      return;
    }
    try {
      // Update the case status in the database
      const updateData = {
        status: status,
      };
      const updateDataWithNotes = {
        status: status,
        onhold_notes: onHoldReason,
      };

      const { error: updateError } = await supabase
        .from("cases")
        .update(status === "on_hold" ? updateDataWithNotes : updateData)
        .eq("id", activeCaseId);

      if (updateError) {
        console.error("Error updating case status:", updateError);
        toast.error("Failed to Update the case Status");
        return;
      }

      if (status === "on_hold") {
        const workstationsToOnHold = stepsData.filter(
          (item) =>
            item.technician?.name !== "System" && item.status !== "completed"
        );

        try {
          const updatePromises = workstationsToOnHold.map(async (item) => {
            const { error: updateError } = await supabase
              .from("workstation_log")
              .update({ status: "on_hold" })
              .eq("id", item.id);

            if (updateError) {
              console.error(
                `Error updating workstation log for ID ${item.id}:`,
                updateError
              );
            }
          });

          await Promise.all(updatePromises);

          const { error: updateCaseError } = await supabase
            .from("cases")
            .update({ isDueDateTBD: true })
            .eq("id", caseDetail.id);

          if (updateCaseError) {
            console.error(
              `Error updating case  isDueDateTBD:`,
              updateCaseError
            );
          }

          setOnHoldModal(false);
        } catch (err) {
          console.error("Error updating workstations to on_hold:", err);
          toast.error("Failed to update workstations to on hold");
        }
      }

      fetchCaseData(true);
      toast.success("Case Updated Successfully.");
    } catch (err) {
      console.error("Error in handleUpdateCaseStatus:", err);
      toast.error("Failed to Update the case Status");
    }
  };

  const handleCaseComplete = () => {
    const isWorkstationCompleted = stepsData.every((item) => {
      if (item?.technician?.name === "System" && item.isNew === true) {
        return true;
      }
      if (item?.technician?.name === "System") {
        return item.status === "completed";
      }
      return item.status === "completed";
    });

    console.log("isWorkstationCompleted:", isWorkstationCompleted);

    // if (stepsData && stepsData.length === 1) {
    //   console.log("System step count is 1, returning false");
    //   return toast.error("Workstation steps have not been created yet.");
    // }

    handleUpdateCaseStatus("completed");
    // if (isWorkstationCompleted) {
    //   console.log("Workstation is completed. Proceeding with status update.");

    // } else {
    //   toast.error("Please Complete the Workstations First.");
    // }
  };

  const handleBackClick = () => {
    safeNavigate("/cases");
  };

  const handleEditClick = () => {
    safeNavigate(`/cases/update?caseId=${activeCaseId}`);
  };
  const handleCloseEditModal = () => {
    setTimeout(() => {
      setEditingInvoice(null);
    }, 0);
  };
  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    const updatedProductIds = updatedInvoice?.items?.map((item) => item.id);
    console.log(updatedInvoice, "updated Invoices");

    fetchCaseData(true);
    toast.success("Invoice Updated SucessFully!!");
  };
  const handleOpenEditModal = (
    invoice: ExtendedCase,
    mode: "edit" | "payment" = "edit"
  ) => {
    setTimeout(() => {
      setEditingInvoice(invoice);
    }, 0);
  };

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
            groups.push(groupStart.toString());
          } else {
            groups.push(`${groupStart}-${prev}`);
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

  const formatTeethNumbers = (teeth: number[]): string => {
    if (!teeth || teeth.length === 0) return "";
    return teeth.join(", "); // Simply join the numbers with a comma
  };

  console.log(caseDetail);
  let productsConsolidate = caseDetail?.products;
  const upperTeeth = new Set([
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ]);
  const lowerTeeth = new Set([
    38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
  ]);

  // const consolidatedProducts: any = productsConsolidate
  //   ? Object.values(
  //     caseDetail?.products?.reduce((acc: any, product: any) => {
  //       const productId = product.id;

  //       if (!productId || !product.teethProduct?.tooth_number) {
  //         return acc;
  //       }

  //       const { tooth_number, type, pontic_teeth } = product.teethProduct;

  //       if (type === "Bridge") {
  //         // Determine if it's an upper, lower, or mixed bridge
  //         const isUpper = tooth_number.every((tooth: number) =>
  //           upperTeeth.has(tooth)
  //         );
  //         const isLower = tooth_number.every((tooth: number) =>
  //           lowerTeeth.has(tooth)
  //         );
  //         const bridgeKey = `${productId}-${isUpper ? "upper" : isLower ? "lower" : "mixed"
  //           }`;

  //         if (!acc[bridgeKey]) {
  //           acc[bridgeKey] = {
  //             ...product,
  //             teethProduct: {
  //               ...product.teethProduct,
  //               tooth_number: [...tooth_number],
  //               pontic_teeth: [...pontic_teeth],
  //             },
  //             service: product.service
  //               ? [
  //                 {
  //                   service: product.service,
  //                   teeth_number: [...tooth_number],
  //                 },
  //               ]
  //               : [],
  //           };
  //         } else {
  //           acc[bridgeKey].teethProduct.tooth_number = [
  //             ...new Set([
  //               ...acc[bridgeKey].teethProduct.tooth_number,
  //               ...tooth_number,
  //             ]),
  //           ];
  //           acc[bridgeKey].teethProduct.pontic_teeth = [
  //             ...new Set([
  //               ...acc[bridgeKey].teethProduct.pontic_teeth,
  //               ...pontic_teeth,
  //             ]),
  //           ];

  //           if (product.service) {
  //             const existingService = acc[bridgeKey].service.find(
  //               (serviceObj: any) => serviceObj.service === product.service
  //             );

  //             if (existingService) {
  //               existingService.teeth_number = [
  //                 ...new Set([
  //                   ...existingService.teeth_number,
  //                   ...tooth_number,
  //                 ]),
  //               ];
  //             } else {
  //               acc[bridgeKey].service.push({
  //                 service: product.service,
  //                 teeth_number: [...tooth_number],
  //               });
  //             }
  //           }
  //         }
  //       } else {
  //         // Non-Bridge products remain separate (no grouping)
  //         acc[`${productId}-${tooth_number.join("-")}`] = {
  //           ...product,
  //           teethProduct: {
  //             ...product.teethProduct,
  //             tooth_number: [...tooth_number],
  //             pontic_teeth: [...pontic_teeth],
  //           },
  //           service: product.service?.[0]?.name
  //             ? [
  //               {
  //                 service: product.service,
  //                 teeth_number: [...tooth_number],
  //               },
  //             ]
  //             : [],
  //         };
  //       }

  //       return acc;
  //     }, {} as any)
  //   )
  //   : [];

  const consolidatedProducts: any = productsConsolidate
    ? Object.values(
      caseDetail?.products?.reduce((acc: any, product: any) => {
        const productId = product.id;

        if (!productId || !product.teethProduct?.tooth_number) {
          return acc;
        }

        const { tooth_number, type, pontic_teeth, manual_occlusal_shade, occlusal_shade, manual_body_shade, body_shade, manual_gingival_shade, gingival_shade, manual_stump_shade, stump_shade } = product.teethProduct;
        const { material, name } = product;

        if (type === "Bridge") {
          // Determine if it's an upper, lower, or mixed bridge
          const isUpper = tooth_number.every((tooth: number) => upperTeeth.has(tooth));
          const isLower = tooth_number.every((tooth: number) => lowerTeeth.has(tooth));
          const bridgeKey = `${productId}-${isUpper ? "upper" : isLower ? "lower" : "mixed"}`;

          if (!acc[bridgeKey]) {
            acc[bridgeKey] = {
              ...product,
              teethProduct: {
                ...product.teethProduct,
                tooth_number: [...tooth_number],
                pontic_teeth: [...pontic_teeth],
              },
              service: product.service
                ? [
                  {
                    service: product.service,
                    teeth_number: [...tooth_number],
                  },
                ]
                : [],
            };
          } else {
            acc[bridgeKey].teethProduct.tooth_number = [...new Set([...acc[bridgeKey].teethProduct.tooth_number, ...tooth_number])];
            acc[bridgeKey].teethProduct.pontic_teeth = [...new Set([...acc[bridgeKey].teethProduct.pontic_teeth, ...pontic_teeth])];

            if (product.service) {
              const existingService = acc[bridgeKey].service.find((serviceObj: any) => serviceObj.service === product.service);

              if (existingService) {
                existingService.teeth_number = [...new Set([...existingService.teeth_number, ...tooth_number])];
              } else {
                acc[bridgeKey].service.push({
                  service: product.service,
                  teeth_number: [...tooth_number],
                });
              }
            }
          }
        } else {
          // **New Grouping Logic for Non-Bridge Products**
          const nonBridgeKey = JSON.stringify({
            type,
            material: material?.name || "-",
            item: name || "-",
            incisal: manual_occlusal_shade || occlusal_shade?.name || "",
            body: manual_body_shade || body_shade?.name || "",
            gingival: manual_gingival_shade || gingival_shade?.name || "",
            stump: manual_stump_shade || stump_shade?.name || "",
          });

          if (!acc[nonBridgeKey]) {
            acc[nonBridgeKey] = {
              ...product,
              teethProduct: {
                ...product.teethProduct,
                tooth_number: [...tooth_number],
                pontic_teeth: [...pontic_teeth],
              },
              service: product.service?.[0]?.name
                ? [
                  {
                    service: product.service,
                    teeth_number: [...tooth_number],
                  },
                ]
                : [],
            };
          } else {
            acc[nonBridgeKey].teethProduct.tooth_number = [...new Set([...acc[nonBridgeKey].teethProduct.tooth_number, ...tooth_number])];
            acc[nonBridgeKey].teethProduct.pontic_teeth = [...new Set([...acc[nonBridgeKey].teethProduct.pontic_teeth, ...pontic_teeth])];

            if (product.service) {
              const existingService = acc[nonBridgeKey].service.find((serviceObj: any) => serviceObj.service === product.service);

              if (existingService) {
                existingService.teeth_number = [...new Set([...existingService.teeth_number, ...tooth_number])];
              } else {
                acc[nonBridgeKey].service.push({
                  service: product.service,
                  teeth_number: [...tooth_number],
                });
              }
            }
          }
        }

        return acc;
      }, {} as any)
    )
    : [];


  console.log(consolidatedProducts, "consolidatedProducts");
  console.log(caseDetail, "caseDetails");




  return (
    <div className={`flex flex-col ${drawerMode ? "h-full" : "min-h-screen"}`}>
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-9 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <QRCodeSVG
                  value={`${baseUrl}/${location.pathname}`}
                  size={64}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-4">
                  {caseDetail.patient_name
                    ? caseDetail.patient_name
                    : "Unknown Patient"}
                </h1>
                <div className="flex items-center space-x-2">
                  {/* <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Case #:</span>
                    <span className="text-xs font-medium text-primary">
                      {caseDetail?.case_number || "N/A"}
                    </span>
                  </div> */}
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">INV #:</span>
                    <div
                      className="text-xs font-medium text-primary cursor-pointer"
                      onClick={() =>
                        loadingAgain ? null : setIsPreviewModalOpen(true)
                      }
                    >
                      {caseDetail?.invoice.length > 0
                        // ? caseDetail.case_number.replace(/^.{3}/, "INV")
                        ? caseDetail.case_number
                        : "N/A"}
                    </div>
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

            <div className="flex flex-col items-end space-y-5">
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
                    <DropdownMenuItem onClick={handleEditClick}>
                      Edit Case
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem
                      onClick={() => {
                        if (caseDetail.status === "completed") {
                          toast.error("Case is Already Completed.");
                        } else {
                          setTimeout(() => setOnHoldModal(true), 50);
                        }
                      }}
                    >
                      On Hold
                    </DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={() => {
                        if (caseDetail.status === "completed") {
                          toast.error("Case is Already Completed.");
                        } else {
                          setOnCancelModal(true);
                        }
                      }}
                    >
                      Cancel Case
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() =>
                    caseDetail.status === "completed"
                      ? setIsScheduleModal(true)
                      : handleCaseComplete()
                  }
                  size="sm"
                >
                  {caseDetail.status === "completed"
                    ? "Schedule Delivery"
                    : "Complete"}
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Received Date</span>
                  <span className="text-sm font-medium">
                    {caseDetail?.received_date &&
                      formatDate(new Date(caseDetail.received_date).toISOString())}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Due Date</span>
                  <span className="text-sm font-medium">
                    {caseDetail.isDueDateTBD
                      ? "TBD"
                      : formatDate(caseDetail.due_date)}
                    {/* : calculateDueDate(caseDetail.due_date, caseDetail.client ?? undefined)} */}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Ship Date</span>
                  <span className="text-sm font-medium">
                    {caseDetail.ship_date
                      ? formatDate(caseDetail.ship_date)
                      : "Not Shipped"}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">
                    Appointment Date
                  </span>
                  <span className="text-sm font-medium">
                    {caseDetail.is_appointment_TBD
                      ? "TBD"
                      : formatDateWithTime_appt(caseDetail.appointment_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
          <div className="md:col-span-2 space-y-6 ">
            <Card className="bg-gradient-to-b from-slate-100 to-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center text-lg ">
                  <CircleDot className="mr-2" size={18} /> Case Progress
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
                    caseId={activeCaseId as string}
                    caseCreatedAt={caseDetail.created_at}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Package className="mr-2" size={18} /> Case Items
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
                      {consolidatedProducts?.map(
                        (product: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">
                              <span
                                className="px-2 py-1 rounded text-white"
                                style={{
                                  backgroundColor:
                                    TYPE_COLORS[
                                    product?.teethProduct
                                      ?.type as keyof typeof TYPE_COLORS
                                    ] || TYPE_COLORS.Other,
                                }}
                              >
                                {product.teethProduct?.type ?? "Null"}
                              </span>
                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator
                                orientation="vertical"
                                className="h-full"
                              />
                            </TableCell>
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">

                              <div>
                                {product?.teethProduct?.tooth_number.length >= 1
                                  ? formatTeethNumbers(
                                    product.teethProduct.tooth_number
                                  )
                                  : null}
                                {product?.teethProduct?.pontic_teeth.length >
                                  0 && (
                                    <span
                                      className="ml-2 text-xs"
                                      style={{
                                        color:
                                          TYPE_COLORS[
                                          product?.teethProduct
                                            ?.type as keyof typeof TYPE_COLORS
                                          ] || TYPE_COLORS.Other,
                                      }}
                                    >
                                      ({"pontic: "}
                                      {product?.teethProduct?.pontic_teeth
                                        .length >= 1
                                        ? formatTeethRange(
                                          product.teethProduct.pontic_teeth
                                        )
                                        : null}
                                      )
                                    </span>
                                  )}
                              </div>

                              {/* <div>
                                {product?.teeth?.length > 0 ? formatTeethRange(product.teeth) : null}
                                {product?.pontic_teeth?.length > 0 && (
                                  <span
                                    className="ml-2 text-xs"
                                    style={{
                                      color:
                                        TYPE_COLORS[product?.teethProduct?.type as keyof typeof TYPE_COLORS] ||
                                        TYPE_COLORS.Other,
                                    }}
                                  >
                                    {" (pontic: "}
                                    {formatTeethRange(product.pontic_teeth)}
                                    {")"}
                                  </span>
                                )}
                              </div> */}

                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator
                                orientation="vertical"
                                className="h-full"
                              />
                            </TableCell>
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">
                              {product.material?.name || "-"} - {product.name}
                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator
                                orientation="vertical"
                                className="h-full"
                              />
                            </TableCell>
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">
                              <div className="space-y-0">
                                {product?.teethProduct?.occlusal_shade?.name ||
                                  product?.teethProduct?.custom_occlusal_shade ||
                                  product?.teethProduct?.manual_occlusal_shade ? (
                                  <p>
                                    <div className="flex gap-2">
                                      <span className="text-gray-500">
                                        Incisal:
                                      </span>
                                      <div className="flex gap-2">
                                        <p>
                                          {product?.teethProduct
                                            ?.manual_occlusal_shade ||
                                            product?.teethProduct
                                              ?.occlusal_shade?.name}
                                        </p>{" "}
                                        <p
                                          className="font-semibold"
                                          style={{
                                            color:
                                              TYPE_COLORS[
                                              product?.product_type
                                                ?.name as keyof typeof TYPE_COLORS
                                              ] || TYPE_COLORS.Other,
                                          }}
                                        >
                                          {product?.teethProduct
                                            ?.custom_occlusal_shade || ""}{" "}
                                          {product?.teethProduct
                                            ?.custom_occlusal_shade &&
                                            "(custom)"}
                                        </p>
                                      </div>
                                    </div>
                                  </p>
                                ) : null}
                                {/* Body shade */}
                                {product?.teethProduct?.body_shade?.name ||
                                  product?.teethProduct?.custom_body_shade ||
                                  product?.teethProduct?.manual_body_shade ? (
                                  <p>
                                    <div className="flex gap-2">
                                      <span className="text-gray-500">
                                        Body:
                                      </span>
                                      <div className="flex gap-2">
                                        <p>
                                          {product?.teethProduct
                                            ?.manual_body_shade ||
                                            product?.teethProduct?.body_shade
                                              ?.name}
                                        </p>{" "}
                                        <p
                                          className="font-semibold"
                                          style={{
                                            color:
                                              TYPE_COLORS[
                                              product?.product_type
                                                ?.name as keyof typeof TYPE_COLORS
                                              ] || TYPE_COLORS.Other,
                                          }}
                                        >
                                          {product?.teethProduct
                                            ?.custom_body_shade || ""}{" "}
                                          {product?.teethProduct
                                            ?.custom_body_shade && "(custom)"}
                                        </p>
                                      </div>
                                    </div>
                                  </p>
                                ) : null}

                                {/* Gingival shade */}
                                {product?.teethProduct?.gingival_shade?.name ||
                                  product?.teethProduct?.custom_gingival_shade ||
                                  product?.teethProduct?.manual_gingival_shade ? (
                                  <p>
                                    <div className="flex gap-2">
                                      <span className="text-gray-500">
                                        Gingival:
                                      </span>
                                      <div className="flex gap-2">
                                        <p>
                                          {product?.teethProduct
                                            ?.manual_gingival_shade ||
                                            product?.teethProduct
                                              ?.gingival_shade?.name}
                                        </p>
                                        <p
                                          className="font-semibold"
                                          style={{
                                            color:
                                              TYPE_COLORS[
                                              product?.product_type
                                                ?.name as keyof typeof TYPE_COLORS
                                              ] || TYPE_COLORS.Other,
                                          }}
                                        >
                                          {product?.teethProduct
                                            ?.custom_gingival_shade || ""}{" "}
                                          {product?.teethProduct
                                            ?.custom_gingival_shade &&
                                            "(custom)"}
                                        </p>
                                      </div>
                                    </div>
                                  </p>
                                ) : null}

                                {/* Stump shade */}
                                {product?.teethProduct?.custom_stump_shade ||
                                  product?.teethProduct?.stump_shade ||
                                  product?.teethProduct?.manual_stump_shade ? (
                                  <p>
                                    <div className="flex gap-2">
                                      <span className="text-gray-500">
                                        Stump:
                                      </span>
                                      <div className="flex gap-2">
                                        <p>
                                          {product?.teethProduct
                                            ?.manual_stump_shade ||
                                            product?.teethProduct?.stump_shade
                                              ?.name}
                                        </p>{" "}
                                        <p
                                          className="font-semibold"
                                          style={{
                                            color:
                                              TYPE_COLORS[
                                              product?.product_type
                                                ?.name as keyof typeof TYPE_COLORS
                                              ] || TYPE_COLORS.Other,
                                          }}
                                        >
                                          {product?.teethProduct
                                            ?.custom_stump_shade || ""}{" "}
                                          {product?.teethProduct
                                            ?.custom_stump_shade && "(custom)"}
                                        </p>
                                      </div>
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
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center items-center w-full">
                  <div className="flex flex-col w-full">
                    <CardTitle className=" text-xl flex items-center">
                      <FileText className="mr-2" size={20} /> Invoice
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">INV #:</span>
                      <div
                        className="text-sm font-medium text-primary cursor-pointer"
                        onClick={() => setIsPreviewModalOpen(true)}
                      >
                        {caseDetail?.invoice.length > 0
                          //? caseDetail.case_number.replace(/^.{3}/, "INV")
                          ? caseDetail.case_number
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant={"default"}
                      size="sm"
                      onClick={() => handleOpenEditModal(caseDetail, "edit")}
                    >
                      Edit Invoice
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="border rounded-lg bg-white">
                  <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-32 text-xs py-0.5 pl-4 pr-0">
                          Tooth / Service
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
                        {/* <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">
                          Quantity
                        </TableHead> */}
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
                          const quantity =
                            product?.discounted_price?.quantity || 1;
                          const subtotal = finalPrice * quantity;
                          const additionalServices = services.filter((item) =>
                            product.additional_services_id.includes(item.id)
                          );

                          const serviceRow =
                            additionalServices.length > 0
                              ? additionalServices.map((item, index) => {
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                      Service
                                    </TableCell>
                                    <TableCell className="w-[1px] p-0">
                                      <Separator
                                        orientation="vertical"
                                        className="h-full"
                                      />
                                    </TableCell>
                                    <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                      {item.name}
                                    </TableCell>
                                    <TableCell className="w-[1px] p-0">
                                      <Separator
                                        orientation="vertical"
                                        className="h-full"
                                      />
                                    </TableCell>
                                    {/* <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                  1
                                </TableCell> */}
                                    <TableCell className="w-[1px] p-0">
                                      <Separator
                                        orientation="vertical"
                                        className="h-full"
                                      />
                                    </TableCell>
                                    <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                      ${item.price}
                                    </TableCell>
                                    <TableCell className="w-[1px] p-0">
                                      <Separator
                                        orientation="vertical"
                                        className="h-full"
                                      />
                                    </TableCell>
                                    <TableCell className="text-xs py-1.5 pl-4 pr-0 text-gray-400">
                                      {product.services_discount}%
                                    </TableCell>
                                    <TableCell className="w-[1px] p-0">
                                      <Separator
                                        orientation="vertical"
                                        className="h-full"
                                      />
                                    </TableCell>
                                    <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                      $
                                      {product.services_discount > 0
                                        ? item.price -
                                        (item.price *
                                          product.services_discount) /
                                        100
                                        : item.price}
                                    </TableCell>
                                    <TableCell className="w-[1px] p-0">
                                      <Separator
                                        orientation="vertical"
                                        className="h-full"
                                      />
                                    </TableCell>
                                    <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                      $ {product.services_discount > 0
                                        ? item.price -
                                        (item.price *
                                          product.services_discount) /
                                        100
                                        : item.price}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                              : null;

                          return (
                            <React.Fragment key={index}>
                              <TableRow>
                                <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                  {product.teethProduct?.tooth_number?.length >
                                    1
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
                                {/* <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                    {product?.discounted_price?.quantity || "-"}
                                  </TableCell> */}
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
                                      {product?.discounted_price?.discount}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">0%</span>
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
                                  {product?.discounted_price?.final_price?.toLocaleString()}
                                </TableCell>
                                <TableCell className="w-[1px] p-0">
                                  <Separator
                                    orientation="vertical"
                                    className="h-full"
                                  />
                                </TableCell>
                                <TableCell className="text-xs py-1.5 pl-4 pr-0 font-medium">
                                  $
                                  {product?.discounted_price?.total?.toLocaleString()}
                                </TableCell>
                              </TableRow>
                              {serviceRow}
                            </React.Fragment>
                          );
                        })}
                      {caseDetail?.common_services &&
                        caseDetail?.common_services?.map((product, index) => {
                          const price = product?.discounted_price?.price || 0;
                          const discount =
                            product?.discounted_price?.discount || 0;
                          const finalPrice =
                            product?.discounted_price?.final_price || price;
                          const quantity =
                            product?.discounted_price?.quantity || 1;
                          const subtotal = finalPrice * quantity;
                          const modifiedService =
                            product.services && product.services.length > 0
                              ? product.services.map((productService: any) =>
                                services
                                  .filter((service) =>
                                    productService.includes(service.id)
                                  )
                                  .map((service) => ({
                                    id: service.id,
                                    name: service.name,
                                    price: service.price,
                                  }))
                              )
                              : [];
                          console.log(modifiedService, "modifiedService");
                          const serviceRow = product.teeth
                            ? modifiedService?.map((item: any) => {
                              return (
                                <TableRow>
                                  <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                    Service{"  "}
                                    {product.teeth
                                      .map((item: number) => item)
                                      .join(",")}
                                  </TableCell>
                                  <TableCell className="w-[1px] p-0">
                                    <Separator
                                      orientation="vertical"
                                      className="h-full"
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                    {item
                                      .map((item: any) => item.name)
                                      .join(",")}
                                  </TableCell>
                                  <TableCell className="w-[1px] p-0">
                                    <Separator
                                      orientation="vertical"
                                      className="h-full"
                                    />
                                  </TableCell>
                                  {/* <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                1
                              </TableCell> */}
                                  <TableCell className="w-[1px] p-0">
                                    <Separator
                                      orientation="vertical"
                                      className="h-full"
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                    ${" "}
                                    {item
                                      .map((item: any) => item.price)
                                      .join(",")}
                                  </TableCell>
                                  <TableCell className="w-[1px] p-0">
                                    <Separator
                                      orientation="vertical"
                                      className="h-full"
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs py-1.5 pl-4 pr-0 text-gray-400">
                                    {product.discount || 0}%
                                  </TableCell>
                                  <TableCell className="w-[1px] p-0">
                                    <Separator
                                      orientation="vertical"
                                      className="h-full"
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                    $
                                    {item
                                      .map(
                                        (item: any) =>
                                          item.price -
                                          (item.price *
                                            (product.discount || 0)) /
                                          100
                                      )
                                      .join(",")}
                                  </TableCell>
                                  <TableCell className="w-[1px] p-0">
                                    <Separator
                                      orientation="vertical"
                                      className="h-full"
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs py-1.5 pl-4 pr-0">
                                    ${" "}
                                    {item
                                      .map(
                                        (item: any) =>
                                          item.price -
                                          (item.price *
                                            (product.discount || 0)) /
                                          100
                                      )
                                      .join(",")}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                            : null;

                          return (
                            <React.Fragment key={index}>
                              {serviceRow}
                            </React.Fragment>
                          );
                        })}
                      <TableRow className="border-t border-gray-200 bg-gray-50 w-full">
                        <TableCell
                          colSpan={6}
                          className="text-xs py-2 pl-4 pr-0 text-right"
                        >
                          Paid Amount: $
                          {caseDetail.invoice[0]?.amount -
                            Number(caseDetail?.invoice?.[0]?.due_amount || 0)}
                        </TableCell>
                        <TableCell
                          colSpan={3}
                          className="text-xs py-2 pl-4 pr-0 text-right"
                        >
                          Due Amount:
                        </TableCell>
                        <TableCell
                          colSpan={2}
                          className="text-xs py-2 pl-4 pr-0 font-medium"
                        >
                          ${caseDetail.invoice[0]?.due_amount}
                        </TableCell>

                        <TableCell
                          colSpan={2}
                          className="text-xs py-2 pl-4 pr-0 font-medium"
                        >
                          Total: $
                          {caseDetail?.invoice[0]?.amount?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="mr-2" size={20} /> Products
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {caseDetail?.custom_occlusal_details ? (
                    <div>
                      <p className="text-gray-600">Incisal Details</p>
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
                    <p className="text-gray-600">Instruction Notes</p>
                    <p className="font-medium">
                      {caseDetail?.instruction_notes || "No Instruction notes"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600">Invoice Notes</p>
                    <p className="font-medium">
                      {caseDetail?.invoice_notes || "No Invoice notes"}
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

                {caseDetail.teethProduct?.map(
                  (
                    product: {
                      tooth_number: number[];
                      body_shade?: { name: string };
                      gingival_shade?: { name: string };
                      occlusal_shade?: { name: string };
                      stump_shade?: { name: string };
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
                                  Incisal Shade:
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
                                  {product.stump_shade?.name || "N/A"}
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
            </Card> */}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Incisal Type
                            </p>
                            <p className="font-medium">
                              {caseDetail?.occlusal_type !== "custom"
                                ? caseDetail?.occlusal_type
                                : caseDetail.custom_occulusal_details ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Contact Type
                            </p>
                            <p className="font-medium">
                              {caseDetail?.contact_type !== "custom"
                                ? caseDetail?.contact_type
                                : caseDetail?.custom_contact_details ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Pontic Type</p>
                            <p className="font-medium">
                              {caseDetail?.pontic_type !== "custom"
                                ? caseDetail?.pontic_type
                                : caseDetail?.custom_pontic_details ||
                                "Not specified"}
                            </p>
                          </div>
                        </div>{" "}
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Margin Design
                            </p>
                            <p className="font-medium">
                              {caseDetail?.margin_design_type !== "custom"
                                ? caseDetail?.margin_design_type
                                : caseDetail?.custom_margin_design_type ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Incisal Design
                            </p>
                            <p className="font-medium">
                              {caseDetail?.occlusion_design_type !== "custom"
                                ? caseDetail?.occlusion_design_type
                                : caseDetail?.custom_occlusion_design_type ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Alloy</p>
                            <p className="font-medium">
                              {caseDetail?.alloy_type !== "custom"
                                ? caseDetail?.alloy_type
                                : caseDetail?.custon_alloy_type ||
                                "Not specified"}
                            </p>
                          </div>
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
                          <p className="text-sm text-gray-500">
                            Instruction Notes
                          </p>
                          <div className="text-sm whitespace-pre-wrap break-words overflow-hidden border rounded p-3 bg-gray-50">
                            {caseDetail.instruction_notes}
                          </div>
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
                        {caseDetail?.attachements
                          ?.filter((file) => file)
                          ?.map((file, index) => {
                            const fileName = file
                              ? decodeURIComponent(
                                file.split("/").pop()?.split("?")[0] || ""
                              )
                              : "";
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                              fileName
                            );

                            return (
                              <div
                                key={index}
                                className="border rounded-lg p-4 space-y-2"
                              >
                                {isImage ? (
                                  <div
                                    className="relative aspect-video w-full overflow-hidden rounded-md"
                                    onClick={() => {
                                      setIsFilePreview(true);
                                      setFiles((files) => {
                                        const filteredFiles = files.filter(
                                          (f) => f !== file
                                        );

                                        return [file, ...filteredFiles];
                                      });
                                    }}
                                  >
                                    <img
                                      src={file}
                                      alt={fileName}
                                      className="object-contain w-full h-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <FileText className="h-8 w-8" />
                                    <span className="text-sm">{fileName}</span>
                                  </div>
                                )}

                                <div className="flex justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadFile(file)}
                                    className="gap-2"
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        {(!caseDetail?.attachements ||
                          caseDetail.attachements.length === 0) && (
                            <p className="text-sm text-gray-500">
                              No attachments found
                            </p>
                          )}
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
      {isPreviewModalOpen && (
        <InvoicePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setIsLoadingPreview(false);
          }}
          formData={{
            clientId: caseDetail.client?.id,
            items: caseDetail.invoice?.[0]?.items || [],
            discount: caseDetail.invoice?.[0]?.discount || 0,
            discountType:
              caseDetail.invoice?.[0]?.discount_type || "percentage",
            tax: caseDetail.invoice?.[0]?.tax || 0,
            notes: caseDetail.invoice?.[0]?.notes || "",
          }}
          caseDetails={[{ ...caseDetail, labDetail: lab as labDetail }]}
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
      {onHoldModal && (
        <OnHoldModal
          onClose={() => {
            setTimeout(() => {
              setOnHoldModal(false);
              document.body.style.pointerEvents = "auto !important"; // Reset pointer-events
            }, 50);
          }}
          onHoldReason={onHoldReason}
          setOnHoldReason={setOnHoldReason}
          isOpen={onHoldModal}
          handleUpdateCaseStatus={() => handleUpdateCaseStatus("on_hold")}
        />
      )}
      {onCancelModal && (
        <OnCancelModal
          onClose={() => setOnCancelModal(false)}
          caseId={caseDetail.id}
          workstations={stepsData}
          fetchCaseData={fetchCaseData}
        />
      )}
      {isScheduleModal && (
        <ScheduleDelivery onClose={() => setIsScheduleModal(false)} />
      )}

      {/* {invoicePreviewModalOpen && (
        <InvoicePreviewModal
          isOpen={invoicePreviewModalOpen}
          onClose={() => setInvoicePreviewModalOpen(false)}
        />
      )} */}

      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice as any}
          mode={"edit"}
          onClose={handleCloseEditModal}
          onSave={handleSaveInvoice}
        />
      )}
      {isFilePreview && (
        <FilePreview files={files} onClose={() => setIsFilePreview(false)} />
      )}
    </div>
  );
};

export default CaseDetails;
