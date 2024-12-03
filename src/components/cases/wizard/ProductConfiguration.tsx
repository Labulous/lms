import React, { useState, useEffect, useMemo } from 'react';
import { 
  Product, 
  MATERIALS,
  ProductMaterial,
  MaterialType,
  VITA_CLASSICAL_SHADES,
  PRODUCT_TYPES
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
import { X } from 'lucide-react';
import {
  Stepper
} from "@/components/ui/stepper";
import { toast } from 'react-hot-toast';
import { Separator } from "@/components/ui/separator";
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@radix-ui/react-hover-card";
import MultiColumnProductSelector from './modals/MultiColumnProductSelector';
import { cn } from "@/lib/utils";

interface ProductConfigurationProps {
  selectedMaterial: ProductMaterial | null;
  onAddToCase: (product: SavedProduct) => void;
  selectedProducts: ProductWithShade[];
  onProductsChange: (products: ProductWithShade[]) => void;
  onMaterialChange: (material: ProductMaterial | null) => void;
}

interface ToothItem {
  id: string;
  teeth: number[];
  isRange: boolean;
  type: string;
  productName: string;
  highlightColor?: string;
  shades?: {
    occlusal?: string;
    body?: string;
    gingival?: string;
  };
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedMaterial,
  onAddToCase,
  selectedProducts,
  onProductsChange,
  onMaterialChange,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [addedTeethMap, setAddedTeethMap] = useState<Map<number, boolean>>(new Map());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
    type?: string;
  }>({});
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [openPopoverIds, setOpenPopoverIds] = useState<Set<string>>(new Set());
  const [arch, setArch] = useState<string>('');
  const [selectedMaterialState, setSelectedMaterialState] = useState<ProductMaterial | null>(selectedMaterial);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMaterial !== selectedMaterialState) {
      setSelectedMaterialState(selectedMaterial);
    }
  }, [selectedMaterial]);

  // Fetch products when component mounts or when material changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await productsService.getProducts();
        // Filter products by selected material if one is selected
        const filteredProducts = selectedMaterial 
          ? fetchedProducts.filter(p => p.material === selectedMaterial)
          : fetchedProducts;
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedMaterial]);

  // Reset selected product when material changes
  useEffect(() => {
    setSelectedProduct(null);
  }, [selectedMaterial]);

  useEffect(() => {
    console.log('Selected material changed:', selectedMaterial);
    setSelectedProduct(null);
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
    setDiscount(0);
    setErrors({});
    if (selectedMaterial) {
      // Set initial type based on material
      setSelectedType(PRODUCT_TYPES[0]);
    } else {
      setSelectedType(null);
    }
  }, [selectedMaterial]);

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

  const handleMaterialSelect = (value: string) => {
    const material = value as ProductMaterial;
    setSelectedMaterialState(material);
    if (onMaterialChange) {
      onMaterialChange(material);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!selectedType || !products) return [];
    return products.filter(product => 
      product.type && Array.isArray(product.type) && product.type.includes(selectedType)
    );
  }, [products, selectedType]);

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

    if (!selectedType) {
      errors.type = 'Please select a type';
    }

    if (selectedTeeth.length === 0) {
      errors.teeth = 'Please select at least one tooth';
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
    if (!selectedType) {
      toast.error('Please select a type before adding');
      return;
    }

    const sortedTeeth = [...teeth].sort((a, b) => a - b);
    const isRange = teeth.length > 1;
    
    // Check for duplicate teeth
    const hasOverlap = sortedTeeth.some(tooth => addedTeethMap.has(tooth));
    if (hasOverlap) {
      toast.error('Some teeth are already added');
      return;
    }

    // Create new tooth item with basic information
    const newItem: ToothItem = {
      id: uuidv4(),
      teeth: sortedTeeth,
      isRange,
      type: selectedType,
      productName: selectedType,
      highlightColor: 'bg-blue-50',
      shades: {
        occlusal: shades.occlusal || '',
        body: shades.middle || '',
        gingival: shades.gingival || ''
      }
    };

    // Create new product for the selected products list
    const newProduct: ProductWithShade = {
      id: newItem.id,
      name: selectedType,
      type: selectedType,
      teeth: sortedTeeth,
      material: '',
      shades: {
        occlusal: shades.occlusal || '',
        body: shades.middle || '',
        gingival: shades.gingival || ''
      },
      price: 0,
      discount: 0,
      notes: ''
    };

    // Update states
    const newMap = new Map(addedTeethMap);
    sortedTeeth.forEach(tooth => {
      newMap.set(tooth, isRange);
    });

    setAddedTeethMap(newMap);
    setToothItems(prev => [...prev, newItem]);
    onProductsChange([...selectedProducts, newProduct]);
    
    // Add highlight effect
    setHighlightedItems(prev => new Set([...prev, newItem.id]));
    setTimeout(() => {
      setHighlightedItems(prev => {
        const next = new Set(prev);
        next.delete(newItem.id);
        return next;
      });
    }, 800);

    // Reset selections
    setSelectedTeeth([]);
    setShades({ occlusal: '', middle: '', gingival: '' });
  };

  const handleShadeSelect = (itemId: string, type: 'occlusal' | 'body' | 'gingival', shade: string) => {
    setToothItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const currentShades = item.shades || {};
          const newShades = {
            ...currentShades,
            [type]: currentShades[type] === shade ? undefined : shade // Toggle shade if it's the same value
          };
          return {
            ...item,
            shades: newShades
          };
        }
        return item;
      });
    });
  };

  const handlePopoverOpenChange = (id: string, open: boolean) => {
    setOpenPopoverIds(prev => {
      const newSet = new Set(prev);
      if (open) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const formatShades = (shades: { occlusal?: string; body?: string; gingival?: string }) => {
    const orderedShades = [
      shades.occlusal || '-',
      shades.body || '-',
      shades.gingival || '-'
    ];
    return orderedShades.join(' / ');
  };

  const formatTeethRange = (teeth: number[]): string => {
    if (!teeth.length) return '';
    
    // Check if it's an arch selection
    const hasUpper = teeth.some(t => t >= 11 && t <= 28);
    const hasLower = teeth.some(t => t >= 31 && t <= 48);
    const isFullArch = teeth.length >= 16; // Assuming a full arch has at least 16 teeth

    if (isFullArch) {
      if (hasUpper && hasLower) return 'All';
      if (hasUpper) return 'Upper';
      if (hasLower) return 'Lower';
    }

    // For non-arch selections, use the original range formatting
    if (teeth.length === 1) return teeth[0].toString();
    
    // Sort teeth numbers
    const sortedTeeth = [...teeth].sort((a, b) => a - b);
    
    // Find continuous ranges
    let ranges: string[] = [];
    let rangeStart = sortedTeeth[0];
    let prev = sortedTeeth[0];
    
    for (let i = 1; i <= sortedTeeth.length; i++) {
      const current = sortedTeeth[i];
      if (current !== prev + 1) {
        // End of a range
        if (rangeStart === prev) {
          ranges.push(rangeStart.toString());
        } else {
          ranges.push(`${rangeStart}-${prev}`);
        }
        rangeStart = current;
      }
      prev = current;
    }
    
    return ranges.join(', ');
  };

  const steps = ["TYPE", "PRODUCT/SERVICE", "TEETH"];
  
  const stepColSpans = [1, 4, 7]; 

  const getCurrentStep = () => {
    if (!selectedProduct) return 0;
    if (!selectedTeeth.length) return 2;
    return 3;
  };

  const handleAddTeeth = () => {
    if (!selectedType || selectedTeeth.length === 0) {
      toast.error('Please select teeth before adding');
      return;
    }

    // Check for duplicate teeth
    const hasOverlap = selectedTeeth.some(tooth => addedTeethMap.has(tooth));
    if (hasOverlap) {
      toast.error('Some teeth are already added');
      return;
    }

    // Create new tooth item
    const newItem: ToothItem = {
      id: uuidv4(),
      teeth: selectedTeeth,
      isRange: false,
      type: selectedType, // Using type as the product name for now
      productName: selectedType,
    };

    // Update the teeth map
    const newMap = new Map(addedTeethMap);
    selectedTeeth.forEach(tooth => {
      newMap.set(tooth, true);
    });

    setAddedTeethMap(newMap);
    setToothItems(prev => [...prev, newItem]);
    setSelectedTeeth([]); // Reset selected teeth
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
            {/* Type Selection - 1 column */}
            <div className="col-span-1 pr-4">
              <Label>Select Type</Label>
              <div className="flex flex-col space-y-1 mt-1.5">
                {PRODUCT_TYPES.map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    className={cn(
                      "justify-start text-left h-auto py-2 px-3",
                      selectedType === type ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white"
                    )}
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Separator after Type Selection */}
            <div className="absolute left-[8.333%] top-0 bottom-0 flex items-stretch">
              <div className="w-px bg-gray-200"></div>
            </div>

            {/* Product Selection - 4 columns */}
            <div className="col-span-4 px-4">
              <Label>Select Teeth</Label>
              <p className="text-sm text-gray-500 mb-2">
                {selectedProduct?.billingType === 'perArch' 
                  ? 'Click any tooth to select the entire arch. You can only select one arch at a time.' 
                  : 'Click individual teeth to select them.'}
              </p>
              <div className="border rounded-lg p-3 bg-white min-h-[400px]">
                <ToothSelector
                  billingType={selectedProduct?.billingType || 'perTooth'}
                  selectedTeeth={selectedTeeth}
                  onSelectionChange={handleToothSelectionChange}
                  onAdd={handleAddToothItems}
                  addedTeethMap={addedTeethMap}
                  disabled={false}
                />
              </div>
              {errors.teeth && (
                <p className="mt-2 text-sm text-red-500">{errors.teeth}</p>
              )}
            </div>

            {/* Separator after Product Selection */}
            <div className="absolute left-[41.666%] top-0 bottom-0 flex items-stretch">
              <div className="w-px bg-gray-200"></div>
            </div>

            {/* Product Details - 7 columns */}
            <div className="col-span-7 px-4">
              <div className="space-y-4">
                {/* Add Shade Table */}
                <div>
                  <Label>Add Shade</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Add shades for the selected teeth
                  </p>
                  <div className="border rounded-lg bg-white">
                    <Table>
                      <TableHeader className="bg-slate-100 border-b border-slate-200">
                        <TableRow>
                          <TableHead className="w-24 text-xs py-0.5 pl-4 pr-0">Type</TableHead>
                          <TableHead className="w-[1px] p-0">
                            <Separator orientation="vertical" className="h-full" />
                          </TableHead>
                          <TableHead className="w-32 text-xs py-0.5 pl-4 pr-0">Tooth</TableHead>
                          <TableHead className="w-[1px] p-0">
                            <Separator orientation="vertical" className="h-full" />
                          </TableHead>
                          <TableHead className="text-xs py-0.5 pl-4 pr-0">Material/Item</TableHead>
                          <TableHead className="w-[1px] p-0">
                            <Separator orientation="vertical" className="h-full" />
                          </TableHead>
                          <TableHead className="text-xs py-0.5 pl-4 pr-0">Shade</TableHead>
                          <TableHead className="w-8 py-0.5 pr-0"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {toothItems.map((item) => (
                          <TableRow 
                            key={item.id}
                            className={cn(
                              "transition-all duration-300 ease-in-out relative",
                              highlightedItems.has(item.id) 
                                ? "bg-blue-50 translate-x-4 shadow-md" 
                                : "bg-transparent translate-x-0"
                            )}
                          >
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">
                              {item.type}
                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator orientation="vertical" className="h-full" />
                            </TableCell>
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">
                              {formatTeethRange(item.teeth)}
                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator orientation="vertical" className="h-full" />
                            </TableCell>
                            <TableCell className="text-xs py-1.5 pl-4 pr-0">
                              <MultiColumnProductSelector
                                materials={MATERIALS}
                                products={products}
                                selectedProduct={selectedProduct}
                                onProductSelect={(product) => {
                                  setSelectedProduct(product);
                                  // Update the item's product name
                                  setToothItems(prev => prev.map(prevItem => 
                                    prevItem.id === item.id 
                                      ? { ...prevItem, productName: product.name }
                                      : prevItem
                                  ));
                                }}
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator orientation="vertical" className="h-full" />
                            </TableCell>
                            <TableCell className="py-1.5 pl-4 pr-0">
                              <div className="flex flex-col space-y-0.5">
                                {item.shades?.occlusal && (
                                  <div className="text-xs">
                                    <span className="text-gray-500">O:</span> {item.shades.occlusal}
                                  </div>
                                )}
                                {item.shades?.body && (
                                  <div className="text-xs">
                                    <span className="text-gray-500">B:</span> {item.shades.body}
                                  </div>
                                )}
                                {item.shades?.gingival && (
                                  <div className="text-xs">
                                    <span className="text-gray-500">G:</span> {item.shades.gingival}
                                  </div>
                                )}
                                {!item.shades?.occlusal && !item.shades?.body && !item.shades?.gingival && (
                                  <span className="text-gray-400 text-xs">No shade selected</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5 pr-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveToothItem(item.teeth[0])}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {toothItems.length === 0 && (
                          <TableRow>
                            <TableCell 
                              colSpan={8} 
                              className="text-center py-6 text-sm text-gray-500"
                            >
                              No teeth has been added
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Material Selection */}
                <div>
                  <Label>Material</Label>
                  <Select 
                    value={selectedMaterialState || ''} 
                    onValueChange={handleMaterialSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Selection */}
                <div>
                  <Label>Select Product</Label>
                  <Select
                    value={selectedProduct?.id || ''}
                    onValueChange={handleProductSelect}
                    disabled={!selectedType}
                  >
                    <SelectTrigger className={cn(
                      "mt-1",
                      !selectedType ? "bg-transparent" : "bg-white"
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

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConfiguration;