import React from 'react';
import { ProductCategory } from '../../data/mockProductData';

interface CategoryListProps {
  categories: ProductCategory[];
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (category: ProductCategory | 'all') => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="divide-y divide-gray-200">
        {/* All Categories Option */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full px-4 py-3 text-left transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-50 border-l-4 border-blue-500'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="font-medium text-gray-900">All Product Categories</span>
        </button>

        {/* Individual Categories */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`w-full px-4 py-3 text-left transition-colors ${
              selectedCategory === category
                ? 'bg-blue-50 border-l-4 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-gray-900">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;