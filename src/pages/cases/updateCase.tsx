import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import OrderDetailsStep from "../../components/cases/wizard/steps/OrderDetailsStep";
import ProductConfiguration from "../../components/cases/wizard/ProductConfiguration";
import FilesStep from "../../components/cases/wizard/steps/FilesStep";
import NotesStep from "../../components/cases/wizard/steps/NotesStep";
import { CaseStatus, FormData, ToothInfo } from "@/types/supabase";
import { DeliveryMethod, updateCase } from "../../data/mockCasesData";
import { Client, clientsService } from "../../services/clientsService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { SavedProduct } from "../../data/mockProductData";
import { getLabIdByUserId } from "@/services/authService";
import { fetchCaseCount } from "@/utils/invoiceCaseNumberConversion";
import { supabase } from "@/lib/supabase";
import {
  ExtendedCase,
  Product,
  DiscountedPrice,
} from "@/components/cases/CaseDetails";
import { FileWithStatus } from "@/components/cases/wizard/steps/FileUploads";

export interface LoadingState {
  action: "save" | "update" | null;
  isLoading: boolean;
  progress?: number;
}

interface ExtendedFormData extends FormData {
  enclosed_case_id?: string;
}
const UpdateCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExtendedFormData>({
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
      instructionNotes: "",
      invoiceNotes: "",
    },
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
  const [caseDetail, setCaseDetail] = useState<ExtendedCase | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    action: null,
    isLoading: false,
  });

  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId");
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
        setLab(labData);

        const clients = await clientsService.getClients(labData.labId);

        if (Array.isArray(clients)) {
          setClients(clients);
        }
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
    if (!formData.workingPanName)
      validationErrors.workingPanName = "Working tag is Required";
    if (!formData.appointmentDate)
      validationErrors.appointmentDate = "Appointment date is Required";

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
        validationErrors.caseDetails.occlusalType = "Occlusal Type is required";
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
          status: formData.status.toLowerCase() as CaseStatus,
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
            status: transformedData.status,
            due_date: transformedData.isDueDateTBD
              ? null
              : transformedData.dueDate,
            isDueDateTBD: transformedData.isDueDateTBD || false,
            appointment_date: transformedData.appointmentDate,
            otherItems: transformedData.otherItems || "",
            invoice_notes: transformedData.notes?.invoiceNotes,
            instruction_notes: transformedData.notes?.instructionNotes,
            occlusal_type: transformedData.caseDetails?.occlusalType,
            contact_type: transformedData.caseDetails?.contactType,
            pontic_type: transformedData.caseDetails?.ponticType,
            custom_contact_details: transformedData.caseDetails?.customContact,
            custom_occulusal_details:
              transformedData.caseDetails?.customOcclusal,
            custom_pontic_details: transformedData.caseDetails?.customPontic,
            lab_id: lab?.labId,
            pan_tag_id: formData.workingPanName,
            case_number: caseNumber,
            enclosed_case_id: formData.enclosed_case_id,
            attachements: selectedFiles.map((item) => item.url),
          },
          products: selectedProducts.filter((item) => item.id && item.type),
          enclosedItems: transformedData.enclosedItems,
          files: selectedFiles,
        };
        await updateCase(newCase, navigate, setLoadingState, caseId as string);
      } catch (error) {
        console.error("Error creating case:", error);
        toast.error("Failed to create case");
      }
    } else {
      toast.error("Unable to Create Case Number");
    }
  };

  useEffect(() => {
    if (!caseId) {
      setError("No case ID provided");
      setLoading(false);
      return;
    }
    const fetchCaseData = async () => {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }
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
              attachements,
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
              tags:working_tags!pan_tag_id (
              id,
              color,name),
              rx_number,
              received_date,
              isDueDateTBD,
              appointment_date,
              otherItems,
              lab_notes,
              invoice_notes,
              instruction_notes,
              occlusal_type,
              contact_type,
              pontic_type,
              qr_code,
              custom_contact_details,
              custom_occulusal_details,
              custom_pontic_details,
              delivery_method,
              enclosed_items:enclosed_case!enclosed_case_id (
              id,
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
        const files = caseDetails?.attachements
          ? caseDetails.attachements.map((item: any) => {
              return { url: item as string }; // Explicitly return an object with the `url`
            })
          : [];
        setSelectedFiles(files);
        console.log(caseDetails, "caseDetails  ");
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
            .in("id", productsIdArray)
            .eq("lab_id", lab.labId);

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
                occlusal_shade_id,
                body_shade_id,
                gingival_shade_id,
                stump_shade_id,
                tooth_number,
                notes,
                product_id,
                custom_occlusal_shade,
                custom_body_shade,
                custom_gingival_shade,
                custom_stump_shade
              `
              )
              .eq("case_product_id", caseProductId)
              .eq("lab_id", lab?.labId);

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

        const caseDataApi: any = caseData;
        setFormData((prevData) => ({
          ...prevData,
          clientId: caseDataApi?.client?.id || "",
          doctorId: caseDataApi?.doctor?.id || "",
          patientFirstName: caseDataApi?.patient_name?.split(" ")[0] || "hi",
          patientLastName: caseDataApi?.patient_name?.split(" ")[1] || "hi2",
          orderDate: caseDataApi?.received_date
            ? new Date(caseDataApi.received_date).toISOString()
            : new Date().toISOString(),
          dueDate: caseDataApi?.due_date
            ? new Date(caseDataApi.due_date).toISOString() // Keep ISO format
            : new Date("2025-01-11").toISOString(),
          status: caseDataApi.status,
          deliveryMethod:
            caseDataApi.delivery_method || ("Pickup" as DeliveryMethod),
          deliveryMethodError: "",
          appointmentDate: caseData.appointment_date || "",
          workingPanName: caseDataApi.tags.id || "",
          workingPanColor: caseDataApi.tags.color || "",

          enclosedItems: {
            ...prevData.enclosedItems, // Preserve existing enclosedItems and override
            impression: caseDataApi.enclosed_items?.impression || 0,
            biteRegistration: caseDataApi.enclosed_items?.biteRegistration || 0,
            photos: caseDataApi.enclosed_items?.photos || 0,
            jig: caseDataApi.enclosed_items?.jig || 0,
            opposingModel: caseDataApi.enclosed_items?.opposingModel || 0,
            articulator: caseDataApi.enclosed_items?.articulator || 0,
            returnArticulator:
              caseDataApi.enclosed_items?.returnArticulator || 0,
            cadcamFiles: caseDataApi.enclosed_items?.cadcamFiles || 0,
            consultRequested: caseDataApi.enclosed_items?.consultRequested || 0,
          },
          otherItems: caseDataApi.otherItems || "",
          isDueDateTBD: prevData.isDueDateTBD || false,
          notes: {
            ...prevData.notes,
            instructionNotes: caseDataApi.instruction_notes || "",
            invoiceNotes: caseDataApi.invoice_notes || "",
          },
          caseDetails: {
            occlusalType: caseData.occlusal_type || "",
            customOcclusal: caseData.custom_occulusal_details || "",
            contactType: caseData.contact_type || "",
            ponticType: caseData.pontic_type || "",
            customPontic: caseData.custom_pontic_details || "",
            customContact: caseData.custom_contact_details || "",
          },
          enclosed_case_id: caseDataApi.enclosed_items.id,
        }));

        setCaseDetail({
          ...(caseData as any),
          products: productsWithDiscounts,
        });
        setSelectedProducts((items) => [
          ...productsWithDiscounts.map((item) => ({
            id: item?.id || "",
            name: item?.name || "",
            type: item?.product_type?.name || "",
            teeth: item?.teethProduct?.tooth_number || [],
            price: item?.discounted_price?.price,
            shades: {
              body: item.teethProduct?.body_shade_id || "",
              gingival: item?.teethProduct?.gingival_shade_id || "",
              occlusal: item?.teethProduct?.occlusal_shade_id || "",
              stump: item.teethProduct?.stump_shade_id || "",
              customBody: item.teethProduct?.custom_body_shade || null,
              customOcclusal: item.teethProduct?.custom_occlusal_shade || null,
              customGingival: item.teethProduct?.custom_gingival_shade || null,
              customStump: item.teethProduct?.custom_stump_shade || null,
            },
            discount: item?.discounted_price?.discount || 0,
            notes: item?.teethProduct?.notes || "",
          })),
        ]);
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
    return () => {
      null;
    };
  }, [caseId, lab]);
  return (
    <div className="p-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Update a Case{" "}
          <span
            className="text-blue-500 underline cursor-pointer"
            onClick={() => {
              caseDetail?.case_number
                ? navigate(`/cases/${caseDetail.id}`)
                : null;
            }}
          >
            {caseDetail?.case_number ?? "Loading..."}
          </span>
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
            formData={formData}
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
            {loadingState.isLoading ? "Updating..." : "Update Case"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCase;
