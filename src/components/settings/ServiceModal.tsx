import React, { SetStateAction, useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { Service } from "../../data/mockServiceData";
import { PRODUCT_TYPES } from "../../data/mockProductData";
import { ServicesFormData } from "@/pages/settings/ProductsServices";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  isLoading: boolean;
  setFormData: React.Dispatch<SetStateAction<ServicesFormData>>;
  formData: ServicesFormData;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  formData,
  setFormData,
}) => {
  const [errors, setErrors] = useState<Partial<ServicesFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ServicesFormData> = {};
    if (!formData.name.trim()) newErrors.name = "Service name is required";
    if (formData.price <= 0)
      newErrors.price_error = "Price must be greater than 0";
    if (formData.categories.length === 0)
      newErrors.category_error = "At least one category must be selected";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const newService: Service = {
      ...formData,
    };

    onSave(newService);
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
                Add New Service
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
          <div className="px-6 py-4 space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Service Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block py-2 w-full border px-4 rounded-md shadow-sm sm:text-sm ${
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
                  className={`block w-full pl-7 border py-2 pr-12 sm:text-sm rounded-md ${
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
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={(event) => handleInputChange(event)}
                className={`mt-1 px-4 block py-2 border w-full rounded-md shadow-sm sm:text-sm ${
                  errors.name
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_client_visible"
                  name="is_client_visible"
                  checked={formData.is_client_visible}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_client_visible"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Visible to Clients
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_taxable"
                  name="is_taxable"
                  checked={formData.is_taxable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_taxable"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Taxable
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply to Categories *
                <span
                  className="ml-1 inline-block"
                  title="Select the product categories this service applies to"
                >
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {PRODUCT_TYPES.map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      id={type}
                      value={type}
                      checked={formData.categories.includes(type)}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={type}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-1 text-sm text-red-600">{errors.categories}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
              >
                {isLoading ? "Inserting..." : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
