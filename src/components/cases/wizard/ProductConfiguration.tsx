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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { toast } from 'react-hot-toast';
import { Separator } from "@/components/ui/separator";
import { Plus, X } from 'lucide-react';

interface ProductConfigurationProps {
  selectedCategory: ProductCategory | null;
  onAddToCase: (product: SavedProduct) => void;
  selectedProducts: ProductWithShade[];
  onProductsChange: (products: ProductWithShade[]) => void;
  onCategoryChange: (category: ProductCategory | null) => void;
}

interface ToothItem {
  tooth: number;
  productName: string;
  shade?: ShadeData;
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
  const [toothItems, setToothItems] = useState<ToothItem[]>([]);
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

  const handleAddToothItems = (teeth: number[]) => {
    if (selectedProduct && teeth.length > 0) {
      const newItems = teeth.map(tooth => ({
        tooth,
        productName: selectedProduct.name,
        shade: undefined
      }));
      setToothItems(prev => [...prev, ...newItems]);
    }
  };

  const handleRemoveToothItem = (tooth: number) => {
    setToothItems(prev => prev.filter(item => item.tooth !== tooth));
  };

  const handleAddShade = (tooth: number) => {
    // TODO: Open shade modal
    console.log('Add shade for tooth:', tooth);
  };

  const steps = [
    "CATEGORY",
    "PRODUCT/SERVICE",
    "TEETH",
    "SHADE"
  ];

  const stepColSpans = [2, 3, 4, 3]; 

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
                        <Label className="text-xs text-gray-500">Discount (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-20 h-7 text-sm bg-white"
                        />
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <Label className="text-xs text-gray-500">Total</Label>
                        <p className="text-sm font-extrabold text-blue-500">
                          ${(selectedProduct.price * (1 - discount / 100)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="absolute left-[calc(41.666%-1px)] top-0 h-full">
              <Separator orientation="vertical" className="h-full" />
            </div>

            {/* Tooth Selection - 4 columns */}
            {selectedProduct && selectedProduct.billingType !== 'generic' && (
              <div className={cn(
                "col-span-4 px-4",
                (!selectedProduct || selectedProduct.billingType === 'generic') && "opacity-50 pointer-events-none"
              )}>
                <Label>Select Teeth</Label>
                <p className="text-sm text-gray-500 mb-2">
                  {!selectedProduct ? 'Select a product to enable tooth selection' :
                   selectedProduct.billingType === 'generic' ? 'This product does not require tooth selection' :
                   selectedProduct.billingType === 'perArch' ? 'Click any tooth to select the entire arch. You can only select one arch at a time.' :
                   'Click individual teeth to select them.'}
                </p>
                <div className="border rounded-lg p-3 bg-white min-h-[400px]">
                  <ToothSelector
                    billingType={selectedProduct?.billingType || 'generic'}
                    selectedTeeth={selectedTeeth}
                    onSelectionChange={handleToothSelectionChange}
                    onAdd={handleAddToothItems}
                    disabled={!selectedProduct || selectedProduct.billingType === 'generic'}
                  />
                </div>
                {errors.teeth && (
                  <p className="mt-2 text-sm text-red-500">{errors.teeth}</p>
                )}
              </div>
            )}

            {/* Vertical Separator */}
            <div className="absolute left-[calc(75%-1px)] top-0 h-full">
              <Separator orientation="vertical" className="h-full" />
            </div>

            {/* Shade Selection - 3 columns */}
            {selectedProduct?.requiresShade && (
              <div className="col-span-3 pl-4">
                <Label>Add Shade</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Add shades for the selected teeth
                </p>
                <div className="border rounded-lg bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24 text-xs">Tooth</TableHead>
                        <TableHead className="text-xs">Item</TableHead>
                        <TableHead className="text-xs">Shade</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toothItems.map((item) => (
                        <TableRow key={item.tooth}>
                          <TableCell className="text-xs py-2">{item.tooth}</TableCell>
                          <TableCell className="text-xs py-2">{item.productName}</TableCell>
                          <TableCell className="py-2">
                            {item.shade ? (
                              <span className="text-xs">
                                {item.shade.occlusal && `O: ${item.shade.occlusal} `}
                                {item.shade.middle && `B: ${item.shade.middle} `}
                                {item.shade.gingival && `G: ${item.shade.gingival}`}
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleAddShade(item.tooth)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 p-1 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveToothItem(item.tooth)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {toothItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-xs text-gray-500">
                            No teeth added yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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