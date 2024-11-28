import React, { useState } from 'react';
import { Plus, Trash2, Palette } from 'lucide-react';
import AddProductModal, { SavedProduct } from '../modals/AddProductModal';
import ShadeModal, { ShadeData } from '../modals/ShadeModal';

interface ProductWithShade extends SavedProduct {
  shade?: ShadeData;
}

const PRODUCT_CATEGORIES = ['Category 1', 'Category 2', 'Category 3'];

interface ProductsServicesStepProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onProductSelect: (productId: string) => void;
  selectedProduct: SavedProduct | null;
  products: SavedProduct[];
  onProductsChange: (products: SavedProduct[]) => void;
}

const ProductsServicesStep: React.FC<ProductsServicesStepProps> = ({
  selectedCategory,
  onCategoryChange,
  onProductSelect,
  selectedProduct,
  products,
  onProductsChange,
}) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductWithShade[]>([]);
  const [isShadeModalOpen, setIsShadeModalOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);

  const handleSaveProduct = (product: SavedProduct) => {
    if (product.billingType === 'perTooth' && product.selectedTeeth.length > 0) {
      // Create individual products for each selected tooth
      const individualProducts = product.selectedTeeth.map(toothNumber => ({
        ...product,
        selectedTeeth: [toothNumber],
        quantity: 1,
        finalPrice: product.finalPrice / product.selectedTeeth.length,
        notes: product.notes ? `${product.notes} - Tooth ${toothNumber}` : `Tooth ${toothNumber}`,
      }));
      setSelectedProducts(prev => [...prev, ...individualProducts]);
    } else {
      setSelectedProducts(prev => [...prev, product]);
    }
    setIsProductModalOpen(false);
  };

  const handleSaveAndAddAnother = (product: SavedProduct) => {
    if (product.billingType === 'perTooth' && product.selectedTeeth.length > 0) {
      const individualProducts = product.selectedTeeth.map(toothNumber => ({
        ...product,
        selectedTeeth: [toothNumber],
        quantity: 1,
        finalPrice: product.finalPrice / product.selectedTeeth.length,
        notes: product.notes ? `${product.notes} - Tooth ${toothNumber}` : `Tooth ${toothNumber}`,
      }));
      setSelectedProducts(prev => [...prev, ...individualProducts]);
    } else {
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddShade = (index: number) => {
    setSelectedProductIndex(index);
    setIsShadeModalOpen(true);
  };

  const handleSaveShade = (shadeData: ShadeData) => {
    if (selectedProductIndex !== null) {
      setSelectedProducts(prev => prev.map((product, index) => 
        index === selectedProductIndex ? { ...product, shade: shadeData } : product
      ));
    }
    setIsShadeModalOpen(false);
    setSelectedProductIndex(null);
  };

  const formatShadeDisplay = (shade?: ShadeData): string => {
    if (!shade) return 'No Shade';
    
    const { type, shades } = shade;
    if (type === '1') return shades.occlusal || 'No Shade';
    if (type === '2') return `${shades.occlusal || ''} / ${shades.gingival || ''}`;
    return `${shades.occlusal || ''} / ${shades.middle || ''} / ${shades.gingival || ''}`;
  };

  return (
    <div className="flex">
      {/* Category Selection in a Vertical Row */}
      <div className="w-48 flex flex-col space-y-2 mr-6 border-r pr-4">
        {PRODUCT_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`
              p-3 text-left rounded-lg transition-colors
              ${selectedCategory === category
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Selection */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">Products & Services</h3>
        {selectedCategory ? (
          <select
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
            value={selectedProduct?.id || ''}
            onChange={(e) => onProductSelect(e.target.value)}
          >
            <option value="">Select a product</option>
            {products
              .filter((product) => product.category === selectedCategory)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
          </select>
        ) : (
          <p className="text-gray-500">Select a category to view products.</p>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg shadow-sm space-y-6">
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setIsProductModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Service
          </button>
        </div>
        
        {selectedProducts.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-500 text-center">
              No products or services added yet. Click the buttons above to add items to this case.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        {product.name}
                        {product.selectedTeeth.length === 1 && (
                          <span className="ml-2 text-sm text-gray-500">
                            (Tooth {product.selectedTeeth[0]})
                          </span>
                        )}
                      </div>
                      {product.notes && (
                        <p className="text-xs text-gray-500 mt-1">{product.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatShadeDisplay(product.shade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${product.originalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {product.discount}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${product.finalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleAddShade(index)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Add Shade"
                        >
                          <Palette className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove Product"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AddProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
          onSaveAndAddAnother={handleSaveAndAddAnother}
        />

        <ShadeModal
          isOpen={isShadeModalOpen}
          onClose={() => {
            setIsShadeModalOpen(false);
            setSelectedProductIndex(null);
          }}
          onSave={handleSaveShade}
          initialShade={selectedProductIndex !== null ? selectedProducts[selectedProductIndex].shade : undefined}
        />
      </div>
    </div>
  );
};

export default ProductsServicesStep;