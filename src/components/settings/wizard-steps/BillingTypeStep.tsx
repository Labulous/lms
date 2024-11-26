import React from 'react';
import { BillingType, BILLING_TYPES } from '../../../data/mockProductData';

interface BillingTypeStepProps {
  selectedType?: BillingType;
  onChange: (type: BillingType) => void;
  error?: string;
}

const BillingTypeStep: React.FC<BillingTypeStepProps> = ({ selectedType, onChange, error }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Billing Type *
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-4">
        {BILLING_TYPES.map((type) => (
          <div
            key={type.value}
            className={`relative flex items-start p-4 border rounded-lg cursor-pointer ${
              selectedType === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-200'
            }`}
            onClick={() => onChange(type.value as BillingType)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={selectedType === type.value}
                  onChange={() => onChange(type.value as BillingType)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label className="ml-3 font-medium text-gray-900">
                  {type.label}
                </label>
              </div>
              <p className="ml-7 text-sm text-gray-500">{type.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingTypeStep;