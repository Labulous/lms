import React, { useState, useEffect } from 'react';
import { 
  Product, 
  mockProducts, 
  PRODUCT_CATEGORIES,
  ProductCategory,
  VITA_CLASSICAL_SHADES 
} from '../../../data/mockProductData';
import ToothSelector from './modals/ToothSelector';
import { ShadeData } from './modals/ShadeModal';
import SelectedProductsModal from './modals/SelectedProductsModal';
import { SavedProduct, ProductWithShade } from './types';

interface ProductConfigurationProps {
  selectedCategory: ProductCategory | null;
  onSave: (product: SavedProduct) => void;
  selectedProducts: ProductWithShade[];
  onProductsChange: (products: ProductWithShade[]) => void;
  onCategoryChange: (category: ProductCategory | null) => void;
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedCategory,
  onSave,
  selectedProducts,
  onProductsChange,
  onCategoryChange,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [shadeType, setShadeType] = useState<'1' | '2' | '3'>('1');
  const [shades, setShades] = useState<ShadeData>({
    occlusal: '',
    middle: '',
    gingival: '',
  });
  const [discount, setDiscount] = useState<number>(0);
  const [errors, setErrors] = useState<{
    product?: string;
    teeth?: string;
  }>({});

  useEffect(() => {
    setSelectedProduct(null);
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
    setDiscount(0);
  }, [selectedCategory]);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const product = productId ? mockProducts.find(p => p.id === productId) || null : null;
    setSelectedProduct(product);
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
  };

  const handleToothSelectionChange = (teeth: number[]) => {
    setSelectedTeeth(teeth);
  };

  const handleShadeChange = (type: keyof ShadeData, value: string) => {
    setShades(prev => ({ ...prev, [type]: value }));
  };

  const handleAddToCase = () => {
    if (!selectedProduct) {
      setErrors(prev => ({ ...prev, product: 'Please select a product' }));
      return;
    }

    if (selectedProduct.billingType !== 'generic' && selectedTeeth.length === 0) {
      setErrors(prev => ({ ...prev, teeth: 'Please select at least one tooth' }));
      return;
    }

    const productToAdd: SavedProduct = {
      ...selectedProduct,
      teeth: selectedTeeth,
      shades,
      discount,
    };

    onSave(productToAdd);
    
    setSelectedProduct(null);
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
    setDiscount(0);
    setErrors({});
  };

  const handleRemoveProduct = (index: number) => {
    onProductsChange(selectedProducts.filter((_, i) => i !== index));
  };

  const handleReviewAndCreate = () => {
    console.log('Review and create case');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value as ProductCategory || null)}
          >
            <option value="">Select a category</option>
            {PRODUCT_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
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
          </div>
        )}

        {selectedProduct && (
          <div className="col-span-2">
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
          </div>
        )}

        {selectedProduct && selectedProduct.billingType !== 'generic' && (
          <div className="col-span-3">
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

        {selectedProduct && selectedTeeth.length > 0 && (
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shade Selection
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Type</label>
                <select
                  value={shadeType}
                  onChange={(e) => setShadeType(e.target.value as '1' | '2' | '3')}
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                >
                  <option value="1">Single Shade</option>
                  <option value="2">Double Shade</option>
                  <option value="3">Triple Shade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Occlusal</label>
                <select
                  value={shades.occlusal}
                  onChange={(e) => handleShadeChange('occlusal', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                >
                  <option value="">Select shade</option>
                  {VITA_CLASSICAL_SHADES.map(shade => (
                    <option key={shade} value={shade}>{shade}</option>
                  ))}
                </select>
              </div>

              {(shadeType === '2' || shadeType === '3') && (
                <div>
                  <label className="block text-sm text-gray-600">Middle</label>
                  <select
                    value={shades.middle}
                    onChange={(e) => handleShadeChange('middle', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
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
                  <label className="block text-sm text-gray-600">Gingival</label>
                  <select
                    value={shades.gingival}
                    onChange={(e) => handleShadeChange('gingival', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
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
        )}
      </div>

      {selectedProduct && (
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleAddToCase}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add to Case
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductConfiguration;