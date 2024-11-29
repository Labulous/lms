import React, { useState, useEffect, useMemo } from 'react';
import { 
  Product, 
  PRODUCT_CATEGORIES,
  ProductCategory,
  VITA_CLASSICAL_SHADES 
} from '../../../data/mockProductData';
import { productsService } from '../../../services/productsService';
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
import { toast } from 'react-hot-toast';
import { Separator } from "@/components/ui/separator";

interface ProductConfigurationProps {
  selectedCategory: ProductCategory | null;
  onAddToCase: (product: SavedProduct) => void;
  selectedProducts: ProductWithShade[];
  onProductsChange: (products: ProductWithShade[]) => void;
  onCategoryChange: (category: ProductCategory | null) => void;
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedCategory,
  onAddToCase,
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
    shade?: string;
  }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await productsService.getProducts();
        console.log('Fetched products:', fetchedProducts);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('Selected category changed:', selectedCategory);
    setSelectedProduct(null);
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
    setDiscount(0);
    setErrors({});
  }, [selectedCategory]);

  const handleProductSelect = (value: string) => {
    const product = products.find(p => p.id === value) || null;
    console.log('Product selected:', {
      id: product?.id,
      name: product?.name,
      billingType: product?.billingType,
      rawProduct: product
    });
    
    if (product && !['perTooth', 'perArch', 'teeth', 'generic', 'calculate'].includes(product.billingType)) {
      console.error('Invalid billing type:', product.billingType);
      toast.error('Invalid product configuration');
      return;
    }
    
    setSelectedProduct(product);
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
    setDiscount(0);
    setErrors({});
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleToothSelectionChange = (teeth: number[]) => {
    console.log('Teeth selection changed:', teeth);
    setSelectedTeeth(teeth);
    setErrors(prev => ({ ...prev, teeth: undefined }));
  };

  const handleShadeChange = (type: keyof ShadeData, value: string) => {
    setShades(prev => ({ ...prev, [type]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!selectedProduct) {
      errors.product = 'Please select a product';
    }

    if (selectedProduct?.billingType !== 'generic' && selectedTeeth.length === 0) {
      errors.teeth = 'Please select at least one tooth';
    }

    if (selectedProduct?.billingType === 'perArch') {
      const hasUpperTeeth = selectedTeeth.some(t => t >= 11 && t <= 28);
      const hasLowerTeeth = selectedTeeth.some(t => t >= 31 && t <= 48);
      
      if (hasUpperTeeth && hasLowerTeeth) {
        errors.teeth = 'Cannot select teeth from both arches for per-arch products';
      }
    }

    if (selectedProduct?.requiresShade && selectedTeeth.length > 0) {
      const { occlusal, middle, gingival } = shades;
      if (!occlusal && !middle && !gingival) {
        errors.shade = 'Please enter at least one shade value';
      }
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddToCase = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    const productToAdd: SavedProduct = {
      ...selectedProduct!,
      teeth: selectedTeeth,
      shades: selectedProduct?.requiresShade ? shades : undefined,
      discount,
    };

    onAddToCase(productToAdd);
    
    // Reset form
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

  const steps = [
    "CATEGORY",
    "PRODUCT/SERVICE",
    "TEETH",
    "SHADE"
  ];

  const stepColSpans = [2, 3, 5, 2]; 

  const getCurrentStep = () => {
    if (!selectedProduct) return 0;
    if (!selectedTeeth.length && selectedProduct.billingType !== 'generic') return 1;
    if (selectedProduct.requiresShade && !shades.occlusal) return 2;
    if (selectedProduct.requiresShade && !shades.middle) return 3;
    return 3;
  };

  return (
    <div className="bg-white shadow overflow-hidden">
      {/* Gradient Header */}
      <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
        <h3 className="text-sm font-medium text-white">Product Configuration</h3>
      </div>

      {/* Content */}
      <div className="p-6 bg-slate-50">
        <Stepper
          steps={steps}
          currentStep={getCurrentStep()}
          colSpans={stepColSpans}
          className="mb-6"
        />

        {/* Form Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-0 relative">
            {/* Category Selection - 2 columns */}
            <div className="col-span-2 pr-4">
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

            {/* Vertical Separator */}
            <div className="absolute left-[calc(16.666%-1px)] top-0 h-full">
              <Separator orientation="vertical" className="h-full" />
            </div>

            {/* Product Selection and Details - 3 columns */}
            <div className="col-span-3 px-4">
              <div className="space-y-4">
                {/* Product Selection */}
                <div>
                  <Label>Select Product</Label>
                  <Select
                    value={selectedProduct?.id || ''}
                    onValueChange={handleProductSelect}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger className={cn(
                      "mt-1",
                      !selectedCategory ? "bg-transparent" : "bg-white"
                    )}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
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
                {selectedProduct && (
                  <>
                    <Separator className="my-6" />
                    <div className="mt-4 flex items-start space-x-4">
                      <div>
                        <Label className="text-xs text-gray-500">Price</Label>
                        <p className="text-sm font-medium">
                          ${selectedProduct.price.toFixed(2)}
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <Label className="text-xs text-gray-500">Billing Type</Label>
                        <p className="text-sm font-medium capitalize">
                          {selectedProduct.billingType === 'perArch' ? 'Per Arch' :
                           selectedProduct.billingType === 'perTooth' ? 'Per Tooth' :
                           'Generic'}
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      {selectedProduct.leadTime && (
                        <div>
                          <Label className="text-xs text-gray-500">Lead Time</Label>
                          <p className="text-sm font-medium">
                            {selectedProduct.leadTime} {selectedProduct.leadTime === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="absolute left-[calc(41.666%-1px)] top-0 h-full">
              <Separator orientation="vertical" className="h-full" />
            </div>

            {/* Tooth Selection - 5 columns */}
            {selectedProduct && selectedProduct.billingType !== 'generic' && (
              <div className={cn(
                "col-span-5 px-4",
                (!selectedProduct || selectedProduct.billingType === 'generic') && "opacity-50 pointer-events-none"
              )}>
                <Label>Select Teeth</Label>
                <p className="text-sm text-gray-500 mb-2">
                  {!selectedProduct ? 'Select a product to enable tooth selection' :
                   selectedProduct.billingType === 'generic' ? 'This product does not require tooth selection' :
                   selectedProduct.billingType === 'perArch' ? 'Click any tooth to select the entire arch. You can only select one arch at a time.' :
                   'Click individual teeth to select them.'}
                </p>
                <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                  <ToothSelector
                    billingType={selectedProduct?.billingType || 'generic'}
                    selectedTeeth={selectedTeeth}
                    onSelectionChange={handleToothSelectionChange}
                    disabled={!selectedProduct || selectedProduct.billingType === 'generic'}
                  />
                </div>
                {errors.teeth && (
                  <p className="mt-2 text-sm text-red-500">{errors.teeth}</p>
                )}
              </div>
            )}

            {/* Vertical Separator */}
            <div className="absolute left-[calc(83.333%-1px)] top-0 h-full">
              <Separator orientation="vertical" className="h-full" />
            </div>

            {/* Shade Selection - 2 columns */}
            {selectedProduct?.requiresShade && (
              <div className="col-span-2 pl-4">
                <Label>Select Shade</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Choose shades for the selected teeth
                </p>
                <div className={cn(
                  "space-y-3",
                  (!selectedProduct || selectedTeeth.length === 0) && "opacity-50 pointer-events-none"
                )}>
                  <div>
                    <Label className="text-xs text-gray-500">Occlusal</Label>
                    <Select
                      value={shades.occlusal}
                      onValueChange={(value) => handleShadeChange('occlusal', value)}
                      disabled={!selectedProduct || selectedTeeth.length === 0}
                    >
                      <SelectTrigger className={cn(
                        "mt-1",
                        (!selectedProduct || selectedTeeth.length === 0) ? "bg-transparent" : "bg-white"
                      )}>
                        <SelectValue placeholder="Select shade" />
                      </SelectTrigger>
                      <SelectContent>
                        {VITA_CLASSICAL_SHADES.map(shade => (
                          <SelectItem key={shade} value={shade}>
                            {shade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Body</Label>
                    <Select
                      value={shades.middle}
                      onValueChange={(value) => handleShadeChange('middle', value)}
                      disabled={!selectedProduct || selectedTeeth.length === 0}
                    >
                      <SelectTrigger className={cn(
                        "mt-1",
                        (!selectedProduct || selectedTeeth.length === 0) ? "bg-transparent" : "bg-white"
                      )}>
                        <SelectValue placeholder="Select shade" />
                      </SelectTrigger>
                      <SelectContent>
                        {VITA_CLASSICAL_SHADES.map(shade => (
                          <SelectItem key={shade} value={shade}>
                            {shade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Gingival</Label>
                    <Select
                      value={shades.gingival}
                      onValueChange={(value) => handleShadeChange('gingival', value)}
                      disabled={!selectedProduct || selectedTeeth.length === 0}
                    >
                      <SelectTrigger className={cn(
                        "mt-1",
                        (!selectedProduct || selectedTeeth.length === 0) ? "bg-transparent" : "bg-white"
                      )}>
                        <SelectValue placeholder="Select shade" />
                      </SelectTrigger>
                      <SelectContent>
                        {VITA_CLASSICAL_SHADES.map(shade => (
                          <SelectItem key={shade} value={shade}>
                            {shade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {errors.shade && (
                  <p className="mt-2 text-sm text-red-500">{errors.shade}</p>
                )}
              </div>
            )}
          </div>

          {/* Add to Case Button in new row */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleAddToCase}
              disabled={!selectedProduct}
            >
              Add to Case
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConfiguration;