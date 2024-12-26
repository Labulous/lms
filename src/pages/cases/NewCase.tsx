import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import OrderDetailsStep from "../../components/cases/wizard/steps/OrderDetailsStep";
import ProductConfiguration from "../../components/cases/wizard/ProductConfiguration";
import FilesStep from "../../components/cases/wizard/steps/FilesStep";
import NotesStep from "../../components/cases/wizard/steps/NotesStep";
import {
  ProductWithShade,
} from "../../components/cases/wizard/types";
import { CaseStatus, FormData } from "@/types/supabase";
import { DeliveryMethod, addCase } from "../../data/mockCasesData";
import { Client, clientsService } from "../../services/clientsService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { SavedProduct } from "../../data/mockProductData";
import { productsService } from "../../services/productsService";

const defaultEnclosedItems = {
  impression: 0,
  biteRegistration: 0,
  photos: 0,
  jig: 0,
  opposingModel: 0,
  articulator: 0,
  returnArticulator: 0,
  cadcamFiles: 0,
  consultRequested: 0,
};



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

  const [selectedCategory, setSelectedCategory] =
    useState<SavedProduct | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>(
    []
  );

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
      // Don't update if the value hasn't changed
      if (prevData[field] === value) {
        return prevData;
      }

      // For nested objects (notes, enclosedItems), do a deep comparison
      if (field === "notes" || field === "enclosedItems") {
        const prevValue = prevData[field];
        if (JSON.stringify(prevValue) === JSON.stringify(value)) {
          return prevData;
        }
      }

      // Update the field with the new value
      return {
        ...prevData,
        [field]: value,
      };
    });
  };

  const handleStepChange = (data: Partial<FormData>) => {
    setFormData((prevData) => {
      const newData: any = { ...prevData };

      // Handle each field separately to properly merge nested objects
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

    fetchClients();
  }, []);
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
      validationErrors.deliveryMethod = "Delivery method is required";
    if (!formData.isDueDateTBD && !formData.dueDate)
      validationErrors.dueDate = "Due date is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      // Create case object
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
          lab_notes: formData.notes?.labNotes,
          technician_notes: formData.notes?.technicianNotes,
          occlusal_type: formData.caseDetails?.occlusalType,
          contact_type: formData.caseDetails?.contactType,
          pontic_type: formData.caseDetails?.ponticType,
          custom_contact_details: formData.caseDetails?.customContact,
          custom_occulusal_details: formData.caseDetails?.customOcclusal,
          custom_pontic_details: formData.caseDetails?.customPontic,
        },
        // labId: user?.labId || "",
        products: selectedProducts,
        enclosedItems: formData.enclosedItems,
        files: selectedFiles,
        // caseDetails: formData.caseDetails,
      };

      // Add case to database
      await addCase(newCase, navigate);
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error("Failed to create case");
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
            onProductsChange={(products)=> handleProductsChange(products)}
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
