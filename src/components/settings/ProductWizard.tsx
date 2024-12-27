import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ProductStep from "./wizard-steps/ProductStep";
import { productsService } from "../../services/productsService";
import { Database } from "../../types/supabase";
import toast from "react-hot-toast"; // Import toast
import { SavedProduct } from "@/data/mockProductData";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  material: { name: string } | null;
  product_type: { name: string } | null;
  billing_type: { name: string; label: string | null } | null;
};

interface ProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: SavedProduct) => void;
  product?: Product; // Optional product for edit mode
}

type WizardStep = "product";

interface FormData {
  name: string;
  price: number;
  description?: string;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  material_id: string;
  product_type_id: string;
  billing_type_id: string;
  requires_shade?: boolean;
  price_error?: string;
}

const ProductWizard: React.FC<ProductWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
}) => {
  const [currentStep] = useState<WizardStep>("product");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: 0,
    leadTime: undefined,
    isClientVisible: true,
    isTaxable: true,
    material_id: "",
    product_type_id: "",
    billing_type_id: "",
    requires_shade: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Initialize form data with product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price || 0,
        leadTime: product.lead_time || undefined,
        isClientVisible: product.is_client_visible,
        isTaxable: product.is_taxable,
        material_id: product.material_id || "",
        product_type_id: product.product_type_id || "",
        billing_type_id: product.billing_type_id || "",
        requires_shade: product.requires_shade || false,
      });
    } else {
      // Reset form when opening for new product
      setFormData({
        name: "",
        price: 0,
        leadTime: undefined,
        isClientVisible: true,
        isTaxable: true,
        material_id: "",
        product_type_id: "",
        billing_type_id: "",
        requires_shade: false,
      });
    }
  }, [product]);

  const validateStep = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (formData.price === undefined || (formData.price as number) < 0)
      newErrors.price_error = "Price must be 0 or greater";
    if (!formData.material_id) newErrors.material_id = "Material is required";
    if (!formData.product_type_id)
      newErrors.product_type_id = "Product Type is required";
    if (!formData.billing_type_id)
      newErrors.billing_type_id = "Billing Type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinish = async () => {
    console.log("handleFinish called");
    if (!validateStep()) {
      console.log("Validation failed", errors);
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description ?? "",
        price: formData.price,
        lead_time: formData.leadTime,
        is_client_visible: formData.isClientVisible,
        is_taxable: formData.isTaxable,
        material_id: formData.material_id || "",
        product_type_id: formData.product_type_id || "",
        billing_type_id: formData.billing_type_id || "",
        requires_shade: formData.requires_shade,
      };

      console.log("Saving product with data:", productData);
      let savedProduct;
      if (product) {
        // Update existing product
        console.log("Updating product:", product.id);
        savedProduct = await productsService.updateProduct(
          product.id,
          productData
        );
      } else {
        // Create new product
        console.log("Creating new product");
        savedProduct = await productsService.addProduct(productData);
      }

      console.log("Saved product:", savedProduct);
      if (savedProduct) {
        onSave(savedProduct as unknown as SavedProduct);
        onClose();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Please try again.");
    }
  };

  const handleStepChange = (data: Partial<FormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
      material_id: data.material_id || prev.material_id || "",
      product_type_id: data.product_type_id || prev.product_type_id || "",
      billing_type_id: data.billing_type_id || prev.billing_type_id || "",
    }));
  };

  const renderStep = () => {
    return (
      <ProductStep
        formData={formData}
        onChange={handleStepChange}
        errors={errors}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {product ? "Edit Product" : "New Product"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{renderStep()}</div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
              >
                {product ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductWizard;
