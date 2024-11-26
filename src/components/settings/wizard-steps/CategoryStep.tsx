import React from 'react';
import { ProductCategory, PRODUCT_CATEGORIES } from '../../../data/mockProductData';

interface CategoryStepProps {
  selectedCategory?: ProductCategory;
  onChange: (category: ProductCategory) => void;
  error?: string;
}

const CategoryStep: React.FC<CategoryStepProps> = ({ selectedCategory, onChange, error }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Product Category *
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PRODUCT_CATEGORIES.map((category) => (
          <div
            key={category}
            className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
              selectedCategory === category
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-200'
            }`}
            onClick={() => onChange(category)}
          >
            <input
              type="radio"
              checked={selectedCategory === category}
              onChange={() => onChange(category)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label className="ml-3 block text-sm font-medium text-gray-900">
              {category}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryStep;