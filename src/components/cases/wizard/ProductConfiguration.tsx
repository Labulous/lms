import React, { useState, useEffect } from 'react';
import { Product, mockProducts } from '../../../data/mockProductData';
import ToothSelector from './modals/ToothSelector';
import { ShadeData } from './modals/ShadeModal';
import SelectedProductsModal from './modals/SelectedProductsModal';

const VITA_CLASSICAL_SHADES = [
  'A1', 'A2', 'A2.5', 'A3', 'A3.5', 'A4',
  'B1', 'B1.5', 'B2', 'B3', 'B4',
  'C1', 'C1.5', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4'
];

interface ProductWithShade extends SavedProduct {
  shade?: ShadeData;
}

interface ProductConfigurationProps {
  selectedCategory: string | null;
  onSave: (product: SavedProduct) => void;
  selectedProducts: ProductWithShade[];
  onProductsChange: (products: ProductWithShade[]) => void;
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedCategory,
  onSave,
  selectedProducts,
  onProductsChange,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discount, setDiscount] = useState(0);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [shadeType, setShadeType] = useState<'1' | '2' | '3'>('1');
  const [shades, setShades] = useState({
    occlusal: '',
    middle: '',
    gingival: ''
  });

  useEffect(() => {
    setSelectedProduct(null);
    resetForm();
  }, [selectedCategory]);

  const resetForm = () => {
    setDiscount(0);
    setSelectedTeeth([]);
    setErrors({});
    setShadeType('1');
    setShades({ occlusal: '', middle: '', gingival: '' });
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    if (!productId) {
      setSelectedProduct(null);
      resetForm();
      return;
    }
    
    const product = mockProducts.find(p => p.id === productId);
    setSelectedProduct(product || null);
    resetForm();
  };

  const handleShadeChange = (position: 'occlusal' | 'middle' | 'gingival', value: string) => {
    setShades(prev => ({
      ...prev,
      [position]: value
    }));
  };

  const handleAddToCase = () => {
    if (!selectedProduct) {
      setErrors({ product: 'Please select a product' });
      return;
    }

    if (selectedTeeth.length === 0 && selectedProduct.billingType !== 'generic') {
      setErrors({ teeth: 'Please select at least one tooth' });
      return;
    }

    const shadeData: ShadeData = {
      type: shadeType,
      shades: {
        ...(shadeType === '1' && { occlusal: shades.occlusal }),
        ...(shadeType === '2' && { middle: shades.middle }),
        ...(shadeType === '3' && {
          occlusal: shades.occlusal,
          middle: shades.middle,
          gingival: shades.gingival
        })
      }
    };

    const newProduct: ProductWithShade = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      discount,
      teeth: selectedTeeth,
      billingType: selectedProduct.billingType,
      shade: shadeData,
    };

    onSave(newProduct);
    resetForm();
  };

  const handleToothSelectionChange = (teeth: number[]) => {
    setSelectedTeeth(teeth);
    setErrors(prev => ({ ...prev, teeth: '' }));
  };

  const handleRemoveProduct = (index: number) => {
    onProductsChange(selectedProducts.filter((_, i) => i !== index));
  };

  const handleReviewAndCreate = () => {
    // Implement the review and create logic here
    console.log('Review and create case');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        {/* Categories - 2 columns */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Product
          </label>
          <select
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            value={selectedProduct?.id || ''}
            onChange={handleProductSelect}
          >
            <option value="">Select a product</option>
            {mockProducts
              .filter(product => product.category === selectedCategory)
              .map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
          </select>
          {errors.product && (
            <p className="mt-1 text-xs text-red-600">{errors.product}</p>
          )}

          {/* Product Details */}
          {selectedProduct && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">${selectedProduct.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Billing Type:</span>
                <span className="font-medium capitalize">{selectedProduct.billingType}</span>
              </div>
              <div className="mt-2">
                <label className="block text-sm text-gray-600">Discount (%)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Teeth Selection - 5 columns */}
        {selectedProduct && selectedProduct.billingType !== 'generic' && (
          <div className="col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Teeth
            </label>
            <ToothSelector
              billingType={selectedProduct.billingType}
              selectedTeeth={selectedTeeth}
              onSelectionChange={handleToothSelectionChange}
            />
            {errors.teeth && (
              <p className="mt-1 text-xs text-red-600">{errors.teeth}</p>
            )}
          </div>
        )}

        {/* Shade Selection - 5 columns */}
        {selectedProduct && selectedTeeth.length > 0 && (
          <div className="col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shade Selection
            </label>
            <div className="space-y-3 bg-gray-50 p-3 rounded-md">
              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={shadeType === '1'}
                    onChange={() => setShadeType('1')}
                  />
                  <span className="ml-2 text-sm">Single Shade</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={shadeType === '2'}
                    onChange={() => setShadeType('2')}
                  />
                  <span className="ml-2 text-sm">Double Shade</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={shadeType === '3'}
                    onChange={() => setShadeType('3')}
                  />
                  <span className="ml-2 text-sm">Triple Shade</span>
                </label>
              </div>

              <div className="space-y-2 mt-3">
                {(shadeType === '1' || shadeType === '3') && (
                  <div>
                    <label className="block text-sm text-gray-700">Occlusal</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      value={shades.occlusal}
                      onChange={(e) => handleShadeChange('occlusal', e.target.value)}
                    >
                      <option value="">Select shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(shadeType === '2' || shadeType === '3') && (
                  <div>
                    <label className="block text-sm text-gray-700">Middle</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      value={shades.middle}
                      onChange={(e) => handleShadeChange('middle', e.target.value)}
                    >
                      <option value="">Select shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                )}

                {shadeType === '3' && (
                  <div>
                    <label className="block text-sm text-gray-700">Gingival</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      value={shades.gingival}
                      onChange={(e) => handleShadeChange('gingival', e.target.value)}
                    >
                      <option value="">Select shade</option>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <option key={shade} value={shade}>{shade}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add to Case Button */}
      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={handleAddToCase}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add to Case
        </button>
      </div>

      {/* Selected Products Modal */}
      <SelectedProductsModal
        products={selectedProducts}
        onRemoveProduct={handleRemoveProduct}
        onReviewAndCreate={handleReviewAndCreate}
      />
    </div>
  );
};

export default ProductConfiguration;