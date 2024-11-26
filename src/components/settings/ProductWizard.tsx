import React, { useState } from 'react';
import { X } from 'lucide-react';
import ProductStep from './wizard-steps/ProductStep';
import BillingTypeStep from './wizard-steps/BillingTypeStep';
import CategoryStep from './wizard-steps/CategoryStep';
import { Product, BillingType, ProductCategory } from '../../data/mockProductData';

interface ProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

type WizardStep = 'product' | 'billing' | 'category';

interface FormData {
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billingType?: BillingType;
  category?: ProductCategory;
}

const ProductWizard: React.FC<ProductWizardProps> = ({ isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('product');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: 0,
    isClientVisible: true,
    isTaxable: true,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateStep = (): boolean => {
    const newErrors: Partial<FormData> = {};

    switch (currentStep) {
      case 'product':
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
        break;
      case 'billing':
        if (!formData.billingType) newErrors.billingType = 'Billing type is required';
        break;
      case 'category':
        if (!formData.category) newErrors.category = 'Category is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    switch (currentStep) {
      case 'product':
        setCurrentStep('billing');
        break;
      case 'billing':
        setCurrentStep('category');
        break;
    }
  };

  const handlePrevious = () => {
    switch (currentStep) {
      case 'billing':
        setCurrentStep('product');
        break;
      case 'category':
        setCurrentStep('billing');
        break;
    }
  };

  const handleFinish = () => {
    if (!validateStep()) return;

    const newProduct: Product = {
      id: (Date.now()).toString(), // Generate a unique ID
      ...formData,
      billingType: formData.billingType!,
      category: formData.category!,
    };

    onSave(newProduct);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'product':
        return (
          <ProductStep
            formData={formData}
            onChange={setFormData}
            errors={errors}
          />
        );
      case 'billing':
        return (
          <BillingTypeStep
            selectedType={formData.billingType}
            onChange={(type) => setFormData({ ...formData, billingType: type })}
            error={errors.billingType}
          />
        );
      case 'category':
        return (
          <CategoryStep
            selectedCategory={formData.category}
            onChange={(category) => setFormData({ ...formData, category })}
            error={errors.category}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">New Product Wizard</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex justify-between">
                {['Product', 'Billing Type', 'Category'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === ['product', 'billing', 'category'].indexOf(currentStep)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-600">{step}</span>
                    {index < 2 && (
                      <div className="w-12 h-1 mx-4 bg-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {renderStep()}
          </div>

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
              <div className="flex space-x-2">
                {currentStep !== 'product' && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {currentStep !== 'category' ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductWizard;