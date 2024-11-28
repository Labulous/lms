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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";

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

  // Determine step completion status
  const steps = [
    {
      id: 1,
      name: '1. Category',
      isCompleted: !!selectedCategory,
      isCurrent: !selectedCategory,
      colSpan: 2
    },
    {
      id: 2,
      name: '2. Product',
      isCompleted: !!selectedProduct,
      isCurrent: !!selectedCategory && !selectedProduct,
      colSpan: 3
    },
    {
      id: 3,
      name: '3. Teeth',
      isCompleted: selectedTeeth.length > 0 || (selectedProduct?.billingType === 'generic'),
      isCurrent: !!selectedProduct && (selectedTeeth.length === 0 && selectedProduct?.billingType !== 'generic'),
      colSpan: 5
    },
    {
      id: 4,
      name: '4. Shade',
      isCompleted: shades.occlusal !== '',
      isCurrent: (selectedTeeth.length > 0 || selectedProduct?.billingType === 'generic') && shades.occlusal === '',
      colSpan: 2
    },
  ];

  return (
    <div className="bg-white shadow overflow-hidden">
      {/* Gradient Header */}
      <div className="px-6 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
        <h3 className="text-sm font-medium text-white">Product Configuration</h3>
      </div>

      {/* Content */}
      <div className="p-6 bg-slate-50">
        {/* Stepper */}
        <Stepper 
          steps={steps} 
        />

        {/* Form Content */}
        <div className="grid grid-cols-12 gap-9 mt-8">
          {/* Category Selection */}
          <div className="col-span-2">
            <Label>Select Category</Label>
            <div className="flex flex-col space-y-1 mt-1.5">
              {PRODUCT_CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={cn(
                    "justify-start text-left h-auto py-2 px-3",
                    selectedCategory === category ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white"
                  )}
                  onClick={() => onCategoryChange(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Selection and Details */}
          <div className="col-span-3">
            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <Label>Select Product</Label>
                <Select
                  value={selectedProduct?.id || undefined}
                  onValueChange={(value) => {
                    const product = mockProducts.find(p => p.id === value) || null;
                    setSelectedProduct(product);
                    setSelectedTeeth([]);
                    setShades({ occlusal: '', middle: '', gingival: '' });
                  }}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts
                      .filter(product => product.category === selectedCategory)
                      .map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.product && (
                  <p className="mt-1 text-xs text-destructive">{errors.product}</p>
                )}
              </div>

              {/* Product Details */}
              <div className={`space-y-2 ${!selectedProduct ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    ${selectedProduct ? selectedProduct.price.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Billing Type:</span>
                  <span className="font-medium capitalize">
                    {selectedProduct ? selectedProduct.billingType : '-'}
                  </span>
                </div>
                <div className="mt-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                    disabled={!selectedProduct}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <Label>Select Teeth</Label>
            <div className={cn(
              "mt-1.5",
              (!selectedProduct || selectedProduct.billingType === 'generic') && "opacity-50"
            )}>
              <ToothSelector
                billingType={selectedProduct?.billingType || 'generic'}
                selectedTeeth={selectedTeeth}
                onSelectionChange={handleToothSelectionChange}
                disabled={!selectedProduct}
              />
            </div>
            {errors.teeth && (
              <p className="mt-1 text-xs text-destructive">{errors.teeth}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label>Select Shade</Label>
            <div className={`space-y-3 ${(!selectedProduct || selectedTeeth.length === 0) ? 'opacity-50' : ''}`}>
              <div>
                <Label>Type</Label>
                <Select
                  value={shadeType}
                  onValueChange={(value) => setShadeType(value as '1' | '2' | '3')}
                  disabled={!selectedProduct || selectedTeeth.length === 0}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Single Shade</SelectItem>
                    <SelectItem value="2">Double Shade</SelectItem>
                    <SelectItem value="3">Triple Shade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Occlusal</Label>
                <Select
                  value={shades.occlusal || undefined}
                  onValueChange={(value) => handleShadeChange('occlusal', value)}
                  disabled={!selectedProduct || selectedTeeth.length === 0}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select shade" />
                  </SelectTrigger>
                  <SelectContent>
                    {VITA_CLASSICAL_SHADES.map(shade => (
                      <SelectItem key={shade} value={shade}>{shade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(shadeType === '2' || shadeType === '3') && (
                <div>
                  <Label>Middle</Label>
                  <Select
                    value={shades.middle || undefined}
                    onValueChange={(value) => handleShadeChange('middle', value)}
                    disabled={!selectedProduct || selectedTeeth.length === 0}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select shade" />
                    </SelectTrigger>
                    <SelectContent>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <SelectItem key={shade} value={shade}>{shade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {shadeType === '3' && (
                <div>
                  <Label>Gingival</Label>
                  <Select
                    value={shades.gingival || undefined}
                    onValueChange={(value) => handleShadeChange('gingival', value)}
                    disabled={!selectedProduct || selectedTeeth.length === 0}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select shade" />
                    </SelectTrigger>
                    <SelectContent>
                      {VITA_CLASSICAL_SHADES.map(shade => (
                        <SelectItem key={shade} value={shade}>{shade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add to Case Button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleAddToCase}
            disabled={!selectedProduct}
          >
            Add to Case
          </Button>
        </div>

        {/* Selected Products Modal */}
        <SelectedProductsModal
          products={selectedProducts}
          onRemoveProduct={(index) => {
            const newProducts = [...selectedProducts];
            newProducts.splice(index, 1);
            onProductsChange(newProducts);
          }}
          onReviewAndCreate={() => {
            // Handle review and create
          }}
        />
      </div>
    </div>
  );
};

export default ProductConfiguration;