import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import OrderDetailsStep from "../../components/cases/wizard/steps/OrderDetailsStep";
import ProductConfiguration from "../../components/cases/wizard/ProductConfiguration";
import FilesStep from "../../components/cases/wizard/steps/FilesStep";
import NotesStep from "../../components/cases/wizard/steps/NotesStep";
import { CaseStatus, FormData } from "@/types/supabase";
import { DeliveryMethod, addCase } from "../../data/mockCasesData";
import { Client, clientsService } from "../../services/clientsService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { SavedProduct } from "../../data/mockProductData";
import { getLabIdByUserId } from "@/services/authService";
import { fetchCaseCount } from "@/utils/invoiceCaseNumberConversion";

const NewCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    clientId: "",
    doctorId: "",
    patientFirstName: "",
    patientLastName: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    status: "In Queue" as CaseStatus,
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
      labNotes: "",
      technicianNotes: "",
    },
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [caseNumber, setCaseNumber] = useState<null | string>(null);
  const [selectedCategory, setSelectedCategory] = useState<SavedProduct | null>(
    null
  );
  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>([]);

  const handleSaveProduct = (product: SavedProduct) => {
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleCategoryChange = (category: SavedProduct | null) => {
    console.log("Category changed:", category);
    setSelectedCategory(category);
  };

  const handleProductsChange = (products: SavedProduct[]) => {
    console.log("Products changed:", products);
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
      console.log(newData, "newData");
      return newData;
    });
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientsService.getClients();
        console.log(data, "data client");

        if (Array.isArray(data)) {
          setClients(data);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    const getCasesLength = async () => {
      try {
        setLoading(true);

        const labData = await getLabIdByUserId(user?.id as string);
        setLab(labData);
        const number = await fetchCaseCount(); // Fetch current case count
        console.log(number, "cases length");

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
          console.log(caseNumber, "Generated Case Number");
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
    fetchClients();
  }, [user?.id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const validationErrors: Partial<FormData> = {};
    if (!formData.clientId) validationErrors.clientId = "Client is required";
    if (!formData.patientFirstName)
      validationErrors.patientFirstName = "Patient first name is required";
    if (!formData.patientLastName)
      validationErrors.patientLastName = "Patient last name is required";
    if (!formData.deliveryMethod)
      validationErrors.deliveryMethodError = "Delivery method is required";
    if (!formData.isDueDateTBD && !formData.dueDate)
      validationErrors.dueDate = "Due date is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (caseNumber) {
      try {
        const newCase: any = {
          overview: {
            client_id: formData.clientId,
            doctor_id: formData.doctorId || "",
            created_by: user?.id || "",
            patient_name:
              formData.patientFirstName + " " + formData.patientLastName,
            pan_number: "",
            rx_number: "",
            received_date: formData.orderDate,
            status: "in_queue",
            due_date: formData.isDueDateTBD ? null : formData.dueDate,
            isDueDateTBD: formData.isDueDateTBD || false,
            appointment_date: formData.appointmentDate,
            otherItems: formData.otherItems || "",
            invoice_notes: formData.notes?.labNotes,
            technician_notes: formData.notes?.technicianNotes,
            occlusal_type: formData.caseDetails?.occlusalType,
            contact_type: formData.caseDetails?.contactType,
            pontic_type: formData.caseDetails?.ponticType,
            custom_contact_details: formData.caseDetails?.customContact,
            custom_occulusal_details: formData.caseDetails?.customOcclusal,
            custom_pontic_details: formData.caseDetails?.customPontic,
            lab_id: lab?.labId,
            case_number: caseNumber,
          },
          products: selectedProducts,
          enclosedItems: formData.enclosedItems,
          files: selectedFiles,
        };

        // Add case to database
        await addCase(newCase, navigate);
      } catch (error) {
        console.error("Error creating case:", error);
        toast.error("Failed to create case");
      }
    } else {
      toast.error("Unable to Create Case Number");
    }
  };
  return (
    <div className="p-6">
      <div className="space-y-4">
        {/* Page Heading */}
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Create a New Case
        </h1>

        {/* Order Details Section */}
        <div className="bg-white shadow overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
            <h2 className="text-sm font-medium text-white">Order Details</h2>
          </div>
          <div className="p-6 bg-slate-50">
            <OrderDetailsStep
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              clients={clients}
              loading={loading}
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
          />
        </div>

        {/* Files and Notes Section Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Notes Section */}
          <div className="bg-white shadow overflow-hidden">
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
          <div className="bg-white shadow overflow-hidden">
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
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/cases")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Case</Button>
        </div>
      </div>
    </div>
  );
};

export default NewCase;
