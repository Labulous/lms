import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Product } from '../../data/mockProductData';

interface ProductListProps {
  products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Product Name
          </div>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider text-right">
            Regular Price
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {products.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No products found in this category
          </div>
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors group"
              onClick={() => {/* Handle edit product */}}
            >
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center">
                  <span className="text-gray-900">{product.name}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                </div>
                <div className="text-right text-gray-900">
                  {formatPrice(product.price)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;