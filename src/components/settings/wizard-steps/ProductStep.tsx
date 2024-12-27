import React, { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/supabase";

type Material = Database["public"]["Tables"]["materials"]["Row"];
type ProductType = Database["public"]["Tables"]["product_types"]["Row"];
type BillingType = Database["public"]["Tables"]["billing_types"]["Row"];

interface FormData {
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  material_id: string;
  product_type_id: string;
  billing_type_id: string;
  requires_shade?: boolean;
}

interface ProductStepProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors: Partial<FormData>;
}

const ProductStep: React.FC<ProductStepProps> = ({
  formData,
  onChange,
  errors,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      const { data: materialsData } = await supabase
        .from("materials")
        .select("*")
        .order("name");
      const { data: productTypesData } = await supabase
        .from("product_types")
        .select("*")
        .order("name");
      const { data: billingTypesData } = await supabase
        .from("billing_types")
        .select("*")
        .order("name");

      if (materialsData) setMaterials(materialsData as any);
      if (productTypesData) setProductTypes(productTypesData as any);
      if (billingTypesData) setBillingTypes(billingTypesData as any);
    };

    fetchReferenceData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let newValue = type === "checkbox" ? checked : (value as string | number);
    if (type === "number") {
      newValue = parseFloat(value) || 0;
    } else if (type !== "checkbox" && !value) {
      newValue = "";
    }

    onChange({
      ...formData,
      [name]: newValue,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Product Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.name
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="material_id"
          className="block text-sm font-medium text-gray-700"
        >
          Material *
        </label>
        <select
          id="material_id"
          name="material_id"
          value={formData.material_id}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.material_id
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
        >
          <option value="">Select a material</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>
        {errors.material_id && (
          <p className="mt-1 text-sm text-red-600">{errors.material_id}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="product_type_id"
          className="block text-sm font-medium text-gray-700"
        >
          Product Type *
        </label>
        <select
          id="product_type_id"
          name="product_type_id"
          value={formData.product_type_id}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.product_type_id
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
        >
          <option value="">Select a product type</option>
          {productTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {errors.product_type_id && (
          <p className="mt-1 text-sm text-red-600">{errors.product_type_id}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="billing_type_id"
          className="block text-sm font-medium text-gray-700"
        >
          Billing Type *
        </label>
        <select
          id="billing_type_id"
          name="billing_type_id"
          value={formData.billing_type_id}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.billing_type_id
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
        >
          <option value="">Select a billing type</option>
          {billingTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label || type.name}
            </option>
          ))}
        </select>
        {errors.billing_type_id && (
          <p className="mt-1 text-sm text-red-600">{errors.billing_type_id}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700"
        >
          Price *
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="price"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            className={`block w-full pl-7 pr-12 sm:text-sm rounded-md ${
              errors.price
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="leadTime"
          className="block text-sm font-medium text-gray-700"
        >
          Lead Time (Days)
          <span
            className="ml-1 inline-block"
            title="Optional: Specify the expected production time in days"
          >
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </span>
        </label>
        <input
          type="number"
          id="leadTime"
          name="leadTime"
          min="0"
          value={formData.leadTime || ""}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requires_shade"
            name="requires_shade"
            checked={formData.requires_shade}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="requires_shade"
            className="ml-2 block text-sm text-gray-700"
          >
            Requires Shade
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isClientVisible"
            name="isClientVisible"
            checked={formData.isClientVisible}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isClientVisible"
            className="ml-2 block text-sm text-gray-700"
          >
            Visible to Clients
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isTaxable"
            name="isTaxable"
            checked={formData.isTaxable}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isTaxable"
            className="ml-2 block text-sm text-gray-700"
          >
            Taxable
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductStep;
