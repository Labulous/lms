import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { ProductType, PRODUCT_TYPES, Product, mockProducts } from '../../../../data/mockProductData';
import ToothSelector from './ToothSelector';

export interface SavedProduct {
  productId: string;
  name: string;
  category: string;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  billingType: string;
  notes?: string;
  selectedTeeth: number[];
  quantity: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: SavedProduct) => void;
  onSaveAndAddAnother: (product: SavedProduct) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveAndAddAnother,
}) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const calculateFinalPrice = (price: number, discountPercent: number): number => {
    return price * (1 - discountPercent / 100);
  };

  const handleTypeSelect = (type: ProductType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedProduct(null);
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const product = mockProducts.find(p => p.id === e.target.value);
    setSelectedProduct(product || null);
    setSelectedTeeth([]);
  };

  const handleToothSelectionChange = (teeth: number[]) => {
    setSelectedTeeth(teeth);
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedProduct) {
      newErrors.product = 'Please select a product';
    }
    if (discount < 0 || discount > 100) {
      newErrors.discount = 'Discount must be between 0 and 100';
    }
    if (selectedProduct?.billingType !== 'generic' && selectedTeeth.length === 0) {
      newErrors.teeth = 'Please select at least one tooth';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (andAddAnother: boolean = false) => {
    if (!validateStep2()) return;

    const quantity = selectedProduct?.billingType === 'perArc' ? 1 : selectedTeeth.length;
    const savedProduct: SavedProduct = {
      productId: selectedProduct!.id,
      name: selectedProduct!.name,
      category: selectedProduct!.category,
      originalPrice: selectedProduct!.price,
      finalPrice: calculateFinalPrice(selectedProduct!.price, discount) * quantity,
      discount,
      billingType: selectedProduct!.billingType,
      notes: notes.trim() || undefined,
      selectedTeeth: selectedTeeth,
      quantity,
    };

    if (andAddAnother) {
      onSaveAndAddAnother(savedProduct);
      // Reset form for next product
      setSelectedProduct(null);
      setDiscount(0);
      setNotes('');
      setSelectedTeeth([]);
      setStep(1);
    } else {
      onSave(savedProduct);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {step === 2 && (
                  <button
                    onClick={handleBack}
                    className="mr-2 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {step === 1 ? 'Select Type' : 'Configure Product'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-4">
                {PRODUCT_TYPES.map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      id={type}
                      value={type}
                      checked={selectedType === type}
                      onChange={(e) => handleTypeSelect(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={type} className="ml-2 block text-sm text-gray-900">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-8">
                {/* Left Column - Tooth Selection */}
                <div className="w-1/2">
                  {selectedProduct && selectedProduct.billingType !== 'generic' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Select Teeth
                      </label>
                      <ToothSelector
                        billingType={selectedProduct.billingType}
                        onSelectionChange={handleToothSelectionChange}
                      />
                      {errors.teeth && (
                        <p className="mt-1 text-sm text-red-600">{errors.teeth}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column - Product Details */}
                <div className="w-1/2 space-y-6">
                  <div>
                    <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                      Select Product *
                    </label>
                    <select
                      id="product"
                      value={selectedProduct?.id || ''}
                      onChange={handleProductSelect}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a product</option>
                      {mockProducts
                        .filter(product => product.type === selectedType)
                        .map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price}
                          </option>
                        ))}
                    </select>
                    {errors.product && (
                      <p className="mt-1 text-sm text-red-600">{errors.product}</p>
                    )}
                  </div>

                  {selectedProduct && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Price
                          </label>
                          <div className="mt-1 text-sm text-gray-900">
                            ${selectedProduct.price.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Billing Type
                          </label>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedProduct.billingType}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          id="discount"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          min="0"
                          max="100"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {errors.discount && (
                          <p className="mt-1 text-sm text-red-600">{errors.discount}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes (Optional)
                        </label>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
              {step === 2 && selectedProduct && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md shadow-sm hover:bg-green-600"
                  >
                    Save & Add Another
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;