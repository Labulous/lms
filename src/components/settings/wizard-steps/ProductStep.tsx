import React from 'react';
import { HelpCircle } from 'lucide-react';

interface FormData {
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
}

interface ProductStepProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors: Partial<FormData>;
}

const ProductStep: React.FC<ProductStepProps> = ({ formData, onChange, errors }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
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
            className={`block w-full pl-7 pr-12 sm:text-sm rounded-md ${
              errors.price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <div>
        <label htmlFor="leadTime" className="block text-sm font-medium text-gray-700">
          Lead Time (Days)
          <span className="ml-1 inline-block" title="Optional: Specify the expected production time in days">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </span>
        </label>
        <input
          type="number"
          id="leadTime"
          name="leadTime"
          min="0"
          value={formData.leadTime || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isClientVisible"
            name="isClientVisible"
            checked={formData.isClientVisible}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isClientVisible" className="ml-2 block text-sm text-gray-700">
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
          <label htmlFor="isTaxable" className="ml-2 block text-sm text-gray-700">
            Taxable
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductStep;