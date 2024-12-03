import React from 'react';
import { ProductType, PRODUCT_TYPES } from '../../../data/mockProductData';
import { Button } from "@/components/ui/button";

interface CategoryStepProps {
  selectedType?: ProductType;
  onTypeSelect: (type: ProductType) => void;
  error?: string;
}

const CategoryStep: React.FC<CategoryStepProps> = ({ selectedType, onTypeSelect, error }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Product Type *
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PRODUCT_TYPES.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "default" : "outline"}
            className={`justify-start text-left h-auto py-2 px-3 ${
              selectedType === type ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white"
            }`}
            onClick={() => onTypeSelect(type)}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryStep;