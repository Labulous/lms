import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, set } from "date-fns";
import { toast } from "react-hot-toast";
import ClientOrderDetailsStep from "../../components/cases/wizard/steps/ClientOrderDetailsStep";
import ProductConfiguration from "../../components/cases/wizard/ProductConfiguration";
import FilesStep, {
  FileWithStatus,
} from "../../components/cases/wizard/steps/FilesStep";
import NotesStep from "../../components/cases/wizard/steps/NotesStep";
import { CaseStatus, FormData } from "@/types/supabase";
import { addCase, DeliveryMethod } from "../../data/mockCasesData";
import { Client, clientsService } from "../../services/clientsService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { SavedProduct } from "../../data/mockProductData";
import { getLabIdByUserId } from "@/services/authService";
import { fetchCaseCount } from "@/utils/invoiceCaseNumberConversion";
import ClientProductConfiguration from "@/components/cases/wizard/ClientProductConfiguration";

export interface LoadingState {
  action: "save" | "update" | null;
  isLoading: boolean;
  progress?: number;
}

const ClientNewCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    clientId: "",
    doctorId: "",
    patientFirstName: "",
    patientLastName: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    status: "draft" as CaseStatus,
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
    notes: {
      instructionNotes: "",
      invoiceNotes: "",
    },
    patient_id: "",
    client_working_tag_id: "",
    client_working_pan_name: "",
    client_working_pan_color: "",
    is_appointment_TBD: false,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [caseNumber, setCaseNumber] = useState<null | string>(null);
  const [selectedCategory, setSelectedCategory] = useState<SavedProduct | null>(
    null
  );
  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    action: null,
    isLoading: false,
  });
  const mainDivRef = useRef<HTMLDivElement>(null);
  const handleSaveProduct = (product: SavedProduct) => {
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleCategoryChange = (category: SavedProduct | null) => {
    setSelectedCategory(category);
  };

  const handleProductsChange = (products: SavedProduct[]) => {
    setSelectedProducts(products);
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

  useEffect(() => {
    const getCasesLength = async () => {
      try {
        setLoading(true);

        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return null;
        }

        const clients = await clientsService.getClients(labData?.labId ?? "");
        if (Array.isArray(clients)) {
          if (user?.role === "client") {
            clients.filter((client) => {
              if (client.email === user?.email) {
                setFormData((prevData) => ({
                  ...prevData,
                  clientId: client.id,
                }));
              }
            });
            setClients(
              clients.filter((client) => client.email === user?.email)
            );
          } else {
            setClients(clients);
          }
        }

        setLab(labData);
        const number = await fetchCaseCount(labData.labId); // Fetch current case count

        if (typeof number === "number") {
          // Generate case number
          const identifier = labData?.name
            ?.substring(0, 3)
            .toUpperCase() as string;
          const currentYear = new Date().getFullYear().toString().slice(-2);
          const currentMonth = String(new Date().getMonth() + 1).padStart(
            2,
            "0"
          );
          const sequentialNumber = String(number + 1).padStart(5, "0");

          const caseNumber = `${identifier}-${currentYear}${currentMonth}-${sequentialNumber}`;
          setCaseNumber(caseNumber);
        } else {
          setCaseNumber(null);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    getCasesLength();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const validationErrors: Partial<FormData> = {};
    if (!formData.clientId) validationErrors.clientId = "Client is required";
    if (!formData.patient_id)
      validationErrors.patient_id = "Patient is required";
    if (!formData.doctorId) validationErrors.doctorId = "Doctor is required";
    if (!formData.deliveryMethod)
      validationErrors.deliveryMethodError = "Delivery method is required";
    if (!formData.isDueDateTBD && !formData.dueDate)
      validationErrors.dueDate = "Due date is required";
    if (!formData.isDueDateTBD && !formData.appointmentDate)
      validationErrors.appointmentDate = "Appointment date is required";
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

    if (caseNumber) {
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
            status: transformedData.status || "in_queue",
            due_date: transformedData.isDueDateTBD
              ? null
              : transformedData.dueDate,
            isDueDateTBD: transformedData.isDueDateTBD || false,
            appointment_date: transformedData.appointmentDate,
            otherItems: transformedData.otherItems || "",
            instruction_notes: transformedData.instructionNotes,
            invoice_notes: transformedData.notes?.invoiceNotes,
            occlusal_type: transformedData.caseDetails?.occlusalType,
            contact_type: transformedData.caseDetails?.contactType,
            pontic_type: transformedData.caseDetails?.ponticType,
            custom_contact_details: transformedData.caseDetails?.customContact,
            custom_occulusal_details:
              transformedData.caseDetails?.customOcclusal,
            custom_pontic_details: transformedData.caseDetails?.customPontic,
            lab_id: lab?.labId,
            case_number: caseNumber,
            attachements: selectedFiles.map((item) => item.url),
            working_pan_name: transformedData.workingPanName,
            working_pan_color: transformedData.workingPanColor,
            working_tag_id: transformedData.workingTagName,
            margin_design_type: transformedData.caseDetails?.marginDesign,
            occlusion_design_type: transformedData.caseDetails?.occlusalDesign,
            alloy_type: transformedData.caseDetails?.alloyType,
            custom_margin_design_type:
              transformedData.caseDetails?.customMargin,
            custom_occlusion_design_type:
              transformedData.caseDetails?.customOcclusalDesign,
            custon_alloy_type: transformedData.caseDetails?.customAlloy,
            is_approved: false,
            created_from: "Client",
          },
          products: selectedProducts,

          enclosedItems: transformedData.enclosedItems,
        };
        // Add case to database
        await addCase(newCase, navigate, setLoadingState);
      } catch (error) {
        console.error("Error creating case:", error);
        toast.error("Failed to create case");
      }
    } else {
      toast.error("Unable to Create Case Number");
    }
  };
  useEffect(() => {
    if (errors && mainDivRef.current) {
      mainDivRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [errors]);

  console.log(formData, "formData");
  return (
    <div className="p-6" ref={mainDivRef}>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Create a New Case
        </h1>

        <div className="bg-white shadow">
          <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
            <h2 className="text-sm font-medium text-white">Order Details</h2>
          </div>
          <div className="p-6 bg-slate-50">
            <ClientOrderDetailsStep
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              clients={clients}
              loading={loading}
              isClient={user?.role === "client" ? true : false}
            />
          </div>
        </div>

        {/* Products & Services */}
        <div className="space-y-4">
          <ClientProductConfiguration
            selectedMaterial={selectedCategory}
            onAddToCase={handleSaveProduct}
            selectedProducts={selectedProducts}
            onProductsChange={(products) => handleProductsChange(products)}
            onMaterialChange={handleCategoryChange}
            onCaseDetailsChange={handleCaseDetailsChange}
            initialCaseDetails={formData.caseDetails}
            setselectedProducts={setSelectedProducts}
            formErrors={errors}
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

export default ClientNewCase;
