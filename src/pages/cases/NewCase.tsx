import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import OrderDetailsStep from "../../components/cases/wizard/steps/OrderDetailsStep";
import ProductConfiguration from "../../components/cases/wizard/ProductConfiguration";
import FilesStep, {
  FileWithStatus,
} from "../../components/cases/wizard/steps/FilesStep";
import NotesStep from "../../components/cases/wizard/steps/NotesStep";
import { CaseStatus, FormData } from "@/types/supabase";
import { addCase, DeliveryMethod } from "../../data/mockCasesData";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { SavedProduct } from "../../data/mockProductData";
import { getLabIdByUserId } from "@/services/authService";
import { fetchCaseCount } from "@/utils/invoiceCaseNumberConversion";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

export interface LoadingState {
  action: "save" | "update" | null;
  isLoading: boolean;
  progress?: number;
}
interface Client {
  id: string;
  client_name: string;
  account_number: string;
  doctors: {
    id: string;
    name: string;
  }[];
}

interface Material {
  id: string;
  name: string;
}

export interface ServiceType {
  id: string | null;
  name: string;
  price: number;
  is_taxable: boolean;
  material?: Material;
  subRows?: {
    services: {
      id: string | null;
      name: string;
      price: number;
      is_taxable: boolean;
      material?: Material;
      discount?: number;
    }[];
  }[];
}
const NewCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    clientId: "",
    doctorId: "",
    patientFirstName: "",
    patientLastName: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    status: "in_progress" as CaseStatus,
    deliveryMethod: "Pickup" as DeliveryMethod,
    deliveryMethodError: "",
    enclosedItems: {
      impression: 0,
      biteRegistration: 0,
      photos: 0,
      jig: 0,
      opposingModel: 0,
      articulator: 0,
      returnArticulator: 0,
      cadcamFiles: 0,
      consultRequested: 0,
    },
    otherItems: "",
    isDueDateTBD: false,
    is_appointment_TBD: false,
    notes: {
      instructionNotes: "",
      invoiceNotes: "",
    },
    isDisplayAcctOnly: false,
    isDisplayDoctorAcctOnly: false,
    isHidePatientName: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SavedProduct | null>(
    null
  );
  const [isAddingPan, setIsAddingPan] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);

  const [clientSpecialProducts, setClientSpecialProducts] = useState<
    { product_id: string; price: number }[] | null
  >([]);
  const [clientSpecialServices, setClientSpecialServices] = useState<
    { service_id: string; price: number }[] | null
  >([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    action: null,
    isLoading: false,
  });
  const mainDivRef = useRef<HTMLDivElement>(null);
  const handleSaveProduct = (product: SavedProduct, service: ServiceType) => {
    setSelectedProducts((prev) => [...prev, product]);
    setSelectedServices((prev) => [...prev, service]);
  };
  const handleCategoryChange = (category: SavedProduct | null) => {
    setSelectedCategory(category);
  };

  const handleProductsChange = (products: SavedProduct[]) => {
    setSelectedProducts(products);
  };

  const handleServicesChange = (services: ServiceType[]) => {
    setSelectedServices(services);
  };

  const handleCaseDetailsChange = (details: any) => {
    setFormData((prev) => ({
      ...prev,
      caseDetails: details,
    }));
  };
  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prevData) => {
      if (prevData[field] === value) {
        return prevData;
      }

      if (field === "notes" || field === "enclosedItems") {
        const prevValue = prevData[field];
        if (JSON.stringify(prevValue) === JSON.stringify(value)) {
          return prevData;
        }
      }

      return {
        ...prevData,
        [field]: value,
      };
    });
  };

  const handleStepChange = (data: Partial<FormData>) => {
    setFormData((prevData: any) => {
      const newData: any = { ...prevData };

      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          newData[key] = {
            ...(prevData[key] || {}),
            ...value,
          };
        } else {
          newData[key] = value;
        }
      });
      return newData;
    });
  };
  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    supabase.from("users").select("lab_id").eq("id", user?.id).single(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const {
    data: clients,
    error: clientsError,
    isLoading: clientLoading,
  } = useQuery(
    labIdData
      ? supabase
        .from("clients")
        .select(
          `
             id,
             client_name,
             account_number,
             doctors:doctors!id (
             id,
             name
             )
            `
        )
        .eq("lab_id", labIdData.lab_id)
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
        .order("client_name", { ascending: true })
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  if (clientsError) {
    return <div>Faild to fetch Clients!</div>;
  }

  if (isLabLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span>Loading clients...</span>
      </div>
    );
  }

  if (labError) {
    console.error("Error fetching lab ID:", labError);
    toast.error("Failed to get labId");
    return null;
  }

  if (!labIdData || !labIdData.lab_id) {
    console.warn("No lab ID found.");
    return null;
  }
  // If no match is found, return null
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    debugger;

    // Validation
    const validationErrors: Partial<FormData> = {};
    if (!formData.clientId) validationErrors.clientId = "Client is required";
    if (!formData.patientFirstName)
      validationErrors.patientFirstName = "Patient first name is required";
    if (!formData.patientLastName)
      validationErrors.patientLastName = "Patient last name is required";
    if (!formData.doctorId) validationErrors.doctorId = "doctor is required";
    if (!formData.deliveryMethod)
      validationErrors.deliveryMethodError = "Delivery method is required";
    if (!formData.isDueDateTBD && !formData.dueDate)
      validationErrors.dueDate = "Due date is required";
    if (!formData.orderDate)
      validationErrors.orderDate = "Order date is required";
    if (!formData.status) validationErrors.statusError = "Status is Required";
    if (
      (selectedProducts.length === 1 && selectedProducts[0].id === "") ||
      selectedProducts[0].type === ""
    )
      validationErrors.itemsError = "Atleast One Item Required";

    if (
      !validationErrors.caseDetails ||
      validationErrors.caseDetails.contactType === null ||
      validationErrors.caseDetails.contactType === ""
    )
      if (
        !formData.caseDetails?.contactType ||
        !formData.caseDetails?.occlusalType ||
        !formData.caseDetails?.ponticType
      ) {
        if (!validationErrors.caseDetails) {
          validationErrors.caseDetails = {};
        }

        if (!formData.caseDetails?.contactType) {
          validationErrors.caseDetails.contactType = "Contact Type is required";
        }

        if (!formData.caseDetails?.occlusalType) {
          validationErrors.caseDetails.occlusalType =
            "Occlusal Type is required";
        }

        if (!formData.caseDetails?.ponticType) {
          validationErrors.caseDetails.ponticType = "Pontic Type is required";
        }
      }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoadingState({ isLoading: true, action: "save" });
      const transformedData = {
        ...formData,
        status: formData.status.toLowerCase() as CaseStatus | string,
      };
      const newCase: any = {
        overview: {
          client_id: transformedData.clientId,
          doctor_id: transformedData.doctorId || "",
          created_by: user?.id || "",
          patient_name:
            transformedData.patientFirstName +
            " " +
            transformedData.patientLastName,
          rx_number: "",
          received_date: transformedData.orderDate,
          status: transformedData.status || "in_progress",
          due_date: transformedData.isDueDateTBD
            ? null
            : transformedData.dueDate,
          isDueDateTBD: transformedData.isDueDateTBD || false,
          appointment_date: transformedData.is_appointment_TBD
            ? null
            : transformedData.appointmentDate || null,
          otherItems: transformedData.otherItems || "",
          instruction_notes: transformedData.notes?.instructionNotes,
          invoice_notes: transformedData.notes?.invoiceNotes,
          occlusal_type: transformedData.caseDetails?.occlusalType,
          contact_type: transformedData.caseDetails?.contactType,
          pontic_type: transformedData.caseDetails?.ponticType,
          custom_contact_details: transformedData.caseDetails?.customContact,
          custom_occulusal_details: transformedData.caseDetails?.customOcclusal,
          custom_pontic_details: transformedData.caseDetails?.customPontic,
          common_services:
            selectedProducts.map((product) => ({
              teeth: product.teeth,
              services: product?.mainServices?.map((item) => item.id) || [],
            })) || [],
          lab_id: labIdData?.lab_id,
          attachements: selectedFiles.map((item) => item.url),
          working_pan_name: transformedData.workingPanName,
          working_pan_color: transformedData.workingPanColor,
          working_tag_id: transformedData.workingTagName,
          margin_design_type: transformedData.caseDetails?.marginDesign,
          occlusion_design_type: transformedData.caseDetails?.occlusalDesign,
          alloy_type: transformedData.caseDetails?.alloyType,
          custom_margin_design_type: transformedData.caseDetails?.customMargin,
          is_appointment_TBD: transformedData.is_appointment_TBD,
          custom_occlusion_design_type:
            transformedData.caseDetails?.customOcclusalDesign,
          custon_alloy_type: transformedData.caseDetails?.customAlloy,
          isDisplayAcctOnly: transformedData.isDisplayAcctOnly || false,
          isDisplayDoctorAcctOnly: transformedData.isDisplayDoctorAcctOnly || false,
          isHidePatientName: transformedData.isHidePatientName || false,
        },
        products: selectedProducts,
        enclosedItems: transformedData.enclosedItems,
        services: selectedServices
      };

      // Add case to database
      await addCase(newCase, navigate, setLoadingState);
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error("Failed to create case");
    }
  };
  console.log(formData, "formdata");
  const handleClientChange = async (clientId: string) => {
    const { data: products, error: productError } = await supabase
      .from("special_product_prices")
      .select(
        `
       product_id,
       price
       )
      `
      )
      .eq("client_id", clientId);
    if (productError) {
      toast.error("Failed to fetch Special Prices");
    }
    setClientSpecialProducts(products as any);
    const { data: services, error: serviceError } = await supabase
      .from("special_service_prices")
      .select(
        `
       service_id,
       price
       )
      `
      )
      .eq("client_id", clientId);
    if (serviceError) {
      toast.error("Failed to fetch Special Prices");
    }
    setClientSpecialServices(services as any);
  };

  console.log(selectedProducts, "selected");
  return (
    <div
      className="p-6"
      ref={mainDivRef}
      onClick={(e) => {
        if (isAddingPan) {
          setIsAddingPan(false);
        }
      }}
    >
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Create a New Case
        </h1>

        <div className="bg-white shadow">
          <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
            <h2 className="text-sm font-medium text-white">Order Details</h2>
          </div>
          <div className="p-6 bg-slate-50">
            <OrderDetailsStep
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              clients={clients as Client[]}
              loading={loading}
              isAddingPan={isAddingPan}
              setIsAddingPan={setIsAddingPan}
              handleClientChange={handleClientChange}
            />
          </div>
        </div>

        {/* Products & Services */}
        <div className="space-y-4">
          <ProductConfiguration
            selectedMaterial={selectedCategory}
            onAddToCase={handleSaveProduct}
            selectedProducts={selectedProducts}
            onProductsChange={(products) => handleProductsChange(products)}
            onMaterialChange={handleCategoryChange}
            onCaseDetailsChange={handleCaseDetailsChange}
            initialCaseDetails={formData.caseDetails}
            setselectedProducts={setSelectedProducts}
            formErrors={errors}
            onServicesChange={(services) => handleServicesChange(services)}
            selectedServices={selectedServices}
            setselectedServices={setSelectedServices}
            clientSpecialProducts={clientSpecialProducts}
            clientSpecialServices={clientSpecialServices}
          />
        </div>

        {/* Files and Notes Section Grid */}

        <div className="grid grid-cols-2 gap-4">
          {/* Notes Section */}
          <div className="bg-white shadow">
            <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
              <h2 className="text-sm font-medium text-white">Notes</h2>
            </div>
            <div className="p-6 bg-slate-50">
              <NotesStep
                formData={formData}
                onChange={handleFormChange}
                errors={errors}
              />
            </div>
          </div>

          {/* Files Section */}
          <div className="bg-white shadow">
            <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
              <h2 className="text-sm font-medium text-white">Files</h2>
            </div>
            <div className="p-6 bg-slate-50">
              <FilesStep
                formData={formData}
                onChange={handleStepChange}
                errors={errors}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                storage="cases"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            disabled={loadingState.isLoading}
            onClick={() => navigate("/cases")}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loadingState.isLoading}>
            {loadingState.isLoading ? "Saving..." : "Save Case"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewCase;
