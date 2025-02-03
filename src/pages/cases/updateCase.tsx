import { useState, useEffect, SetStateAction } from "react";
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
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

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
    is_appointment_TBD: false,
    otherItems: "",
    isDueDateTBD: false,
    notes: {
      instructionNotes: "",
      invoiceNotes: "",
    },
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [selectedCategory, setSelectedCategory] = useState<SavedProduct | null>(
    null
  );
  const [isAddingPan, setIsAddingPan] = useState(false);
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

  const { data: caseDataa, error: caseError } = useQuery(
    caseId
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
          zip_code
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
          user_id,
          id
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
          case_product_id,
          tooth_number,
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
          .eq("id", caseId)
          .single()
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // console.log(caseDataa, "caseDataa");
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
          lead_time: tp.product.lead_time,
          is_client_visible: tp.product.is_client_visible,
          is_taxable: tp.product.is_taxable,
          created_at: tp.product.created_at,
          updated_at: tp.product.updated_at,
          requires_shade: tp.product.requires_shade,
          material: tp.product.material,
          product_type: tp.product.product_type,
          billing_type: tp.product.billing_type,
          discounted_price: caseItem?.discounted_price[index],
          teethProduct: {
            id: tp.id,
            is_range: tp.is_range,
            tooth_number: tp.tooth_number,
            product_id: tp.product_id,
            case_product_id: tp.id,
            occlusal_shade: tp.occlusal_shade,
            body_shade: tp.body_shade,
            gingival_shade: tp.gingival_shade,
            additional_service_id: tp.additional_service_id,
            stump_shade: tp.stump_shade,
            manual_occlusal_shade: tp.manual_occlusal_shade,
            manual_body_shade: tp.manual_body_shade,
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

  useEffect(() => {
    const getCasesLength = async () => {
      try {
        setLoading(false);

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
          received_date: transformedData.isDueDateTBD
            ? null
            : transformedData.orderDate,
          status: transformedData.status,
          due_date: transformedData.isDueDateTBD
            ? null
            : transformedData.dueDate,
          isDueDateTBD: transformedData.isDueDateTBD || false,
          appointment_date: transformedData.is_appointment_TBD
            ? null
            : transformedData.appointmentDate || null,
          otherItems: transformedData.otherItems || "",
          invoice_notes: transformedData.notes?.invoiceNotes,
          is_appointment_TBD: transformedData.is_appointment_TBD,
          instruction_notes: transformedData.notes?.instructionNotes,
          occlusal_type: transformedData.caseDetails?.occlusalType,
          contact_type: transformedData.caseDetails?.contactType,
          pontic_type: transformedData.caseDetails?.ponticType,
          custom_contact_details: transformedData.caseDetails?.customContact,
          custom_occulusal_details: transformedData.caseDetails?.customOcclusal,
          custom_pontic_details: transformedData.caseDetails?.customPontic,
          margin_design_type: transformedData.caseDetails?.marginDesign,
          occlusion_design_type: transformedData.caseDetails?.occlusalDesign,
          alloy_type: transformedData.caseDetails?.alloyType,
          custom_margin_design_type: transformedData.caseDetails?.customMargin,
          custom_occlusion_design_type:
            transformedData.caseDetails?.customOcclusalDesign,
          custon_alloy_type: transformedData.caseDetails?.customAlloy,
          lab_id: lab?.labId,
          working_tag_id: formData.workingTagName,
          working_pan_name: formData.workingPanName,
          working_pan_color: formData.workingPanColor,
          enclosed_case_id: transformedData.enclosed_case_id,
          attachements: selectedFiles.map((item) => item.url),
        },
        invoiceId: caseDetailApi?.invoice?.[0].id,
        products: selectedProducts.filter((item) => item.id && item.type),
        enclosedItems: transformedData.enclosedItems,
        enclosed_item_id: transformedData.enclosed_case_id,
        files: selectedFiles,
      };
      console.log(newCase, "newCase");
      await updateCase(
        newCase,
        navigate,
        setLoadingState,
        caseId as string,
        caseDetail?.invoice[0].amount,
        Number(caseDetail?.invoice[0].due_amount)
      );
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error("Failed to create case");
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
        const caseDetails: any = caseDetailApi;
        const files = caseDetails?.attachements
          ? caseDetails.attachements.map((item: any) => {
              return { url: item as string }; // Explicitly return an object with the `url`
            })
          : [];
        setSelectedFiles(files);
        // console.log(caseDetails, "caseDetails  ");
        const productsIdArray = caseDetails?.product_ids[0].products_id;
        const caseProductId = caseDetails?.product_ids[0]?.id;

        const caseDataApi: any = caseDetailApi;

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
          appointmentDate: caseDataApi.appointment_date || "",
          workingPanName: caseDataApi.working_pan_name || "",
          workingTagName: caseDataApi.tags?.id || null,
          workingPanColor: caseDataApi.working_pan_color || "",
          is_appointment_TBD: caseDataApi.is_appointment_TBD,
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
          isDueDateTBD: caseDataApi.isDueDateTBD || false,
          notes: {
            ...prevData.notes,
            instructionNotes: caseDataApi.instruction_notes || "",
            invoiceNotes: caseDataApi.invoice_notes || "",
          },
          caseDetails: {
            occlusalType: caseDataApi.occlusal_type || "",
            customOcclusal: caseDataApi.custom_occulusal_details || "",
            contactType: caseDataApi.contact_type || "",
            ponticType: caseDataApi.pontic_type || "",
            customPontic: caseDataApi.custom_pontic_details || "",
            customContact: caseDataApi.custom_contact_details || "",
            marginDesign: caseDataApi?.margin_design_type || "",
            occlusalDesign: caseDataApi?.occlusion_design_type || "",

            alloyType: caseDataApi?.alloy_type || "",
            customMargin: caseDataApi?.custom_margin_design_type || "",
            customOcclusalDesign:
              caseDataApi?.custom_occlusion_design_type || "",
            customAlloy: caseDataApi?.custon_alloy_type || "",
          },
          enclosed_case_id: caseDataApi.enclosed_items.id,
        }));

        setCaseDetail({
          ...(caseDataApi as any),
          products: caseDataApi.products,
        });
        console.log(caseDataApi.products, "caseDataApi.products");
        setSelectedProducts(() => {
          const groupedProducts: any = {};

          caseDataApi.products.forEach((item: any) => {
            const productId = item?.id || "";

            if (!groupedProducts[productId]) {
              groupedProducts[productId] = {
                id: productId,
                name: item?.name || "",
                type: item?.product_type?.name || "",
                price: item?.discounted_price?.price || 0,
                additional_service_id: item.additional_service_id,
                discount: item?.discounted_price?.discount || 0,
                teeth: new Set(), // To store unique teeth numbers
                pontic_teeth: new Set(), // To store unique pontic teeth
                notes: item?.teethProduct?.notes || "",
                subRows: [], // Subrows for each individual tooth
              };
            }

            // Add teeth & pontic_teeth while ensuring uniqueness
            item.teethProduct?.tooth_number?.forEach((tooth: number) =>
              groupedProducts[productId].teeth.add(tooth)
            );
            item.teethProduct?.pontic_teeth?.forEach((tooth: number) =>
              groupedProducts[productId].pontic_teeth.add(tooth)
            );

            // Create subRow for individual tooth
            item.teethProduct?.tooth_number?.forEach((tooth: number) => {
              groupedProducts[productId].subRows.push({
                id: productId,
                name: item?.name || "",
                type: item?.product_type?.name || "",
                price: item?.discounted_price?.price || 0,
                additional_service_id: item.additional_service_id ?? null,
                quantity: item.discounted_price.quantity,
                discount: item?.discounted_price?.discount || 0,
                discounted_price_id: item.discounted_price?.id,
                case_product_id: item.teethProduct.case_product_id,
                teeth: [tooth], // Single tooth per subRow
                pontic_teeth: item.teethProduct?.pontic_teeth?.includes(tooth)
                  ? [tooth]
                  : [],
                notes: item?.teethProduct?.notes || "",
                shades: {
                  body_shade: item.teethProduct?.body_shade_id || "",
                  gingival_shade: item?.teethProduct?.gingival_shade_id || "",
                  occlusal_shade: item?.teethProduct?.occlusal_shade_id || "",
                  stump_shade: item.teethProduct?.stump_shade_id || "",
                  custom_body: item.teethProduct?.custom_body_shade || null,
                  custom_occlusal:
                    item.teethProduct?.custom_occlusal_shade || null,
                  custom_gingival:
                    item.teethProduct?.custom_gingival_shade || null,
                  custom_stump: item.teethProduct?.custom_stump_shade || null,
                  manual_body: item.teethProduct?.manual_body_shade || null,
                  manual_occlusal:
                    item.teethProduct?.manual_occlusal_shade || null,
                  manual_gingival:
                    item.teethProduct?.manual_gingival_shade || null,
                  manual_stump: item.teethProduct?.manual_stump_shade || null,
                },
              });
            });
          });

          // Convert Set back to array for each main product row
          return Object.values(groupedProducts as Record<string, any>).map(
            (product: any) => ({
              ...product,
              teeth: Array.from(product.teeth || []),
              pontic_teeth: Array.from(product.pontic_teeth || []),
            })
          );
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
    if (caseDetailApi) {
      fetchCaseData();
    }

    console.log("use effect running");
    return () => {
      null;
    };
  }, [caseId, clients]);
  console.log(caseDetail, "case Detail");
  return (
    <div
      className="p-6"
      onClick={(e) => {
        if (isAddingPan) {
          setIsAddingPan(false);
        }
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">
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
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loadingState.isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loadingState.isLoading}>
              {loadingState.isLoading && loadingState.action === "update" ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Case"
              )}
            </Button>
          </div>
        </div>

        <div className="bg-white shadow">
          <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
            <h2 className="text-sm font-medium text-white">Order Details</h2>
          </div>
          <div className="p-6 bg-slate-50">
            <OrderDetailsStep
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              clients={clients.map((item) => ({
                id: item.id,
                client_name: item.clientName,
                doctors: item.doctors.map((item) => ({
                  id: item.id as string,
                  name: item.name,
                })),
              }))}
              loading={loading}
              isAddingPan={isAddingPan}
              setIsAddingPan={setIsAddingPan}
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
