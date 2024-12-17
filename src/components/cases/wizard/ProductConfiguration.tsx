import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { 
  MATERIALS,
  ProductMaterial,
  MaterialType,
  VITA_CLASSICAL_SHADES,
  PRODUCT_TYPES,
  ProductType
} from '@/data/mockProductData';
import { Product, ShadeData, ProductCategory, BillingType, PonticType } from '@/types/supabase';
import { productsService } from '@/services/productsService';
import ToothSelector, { TYPE_COLORS } from './modals/ToothSelector';
import SelectedProductsModal from './modals/SelectedProductsModal';
import { SavedProduct, ProductWithShade } from './types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { X, Plus, StickyNote } from 'lucide-react';
import {
  Stepper
} from '@/components/ui/stepper';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@radix-ui/react-hover-card";
import MultiColumnProductSelector from './modals/MultiColumnProductSelector';
import { ReactComponent as CrownIcon } from '@/assets/types/crown.svg';
import { ReactComponent as BridgeIcon } from '@/assets/types/bridge.svg';
import { ReactComponent as ImplantIcon } from '@/assets/types/implant.svg';
import { ReactComponent as RemovableIcon } from '@/assets/types/removable.svg';
import { ReactComponent as CopingIcon } from '@/assets/types/coping.svg';
import { ReactComponent as ApplianceIcon } from '@/assets/types/appliance.svg';

const OCCLUSAL_OPTIONS = [
  'N/A',
  'Light',
  'Medium',
  'Heavy',
  'Custom'
] as const;

const CONTACT_OPTIONS = [
  'N/A',
  'Light',
  'Medium',
  'Heavy',
  'Custom'
] as const;

const PONTIC_OPTIONS = ['N/A', ...Object.values(PonticType)];

interface ProductConfigurationProps {
  selectedMaterial: ProductMaterial | null;
  onAddToCase: (product: SavedProduct) => void;
  selectedProducts: ProductWithShade[];
  onProductsChange: (products: ProductWithShade[]) => void;
  onMaterialChange: (material: ProductMaterial | null) => void;
  onCaseDetailsChange: (details: {
    occlusalType: string;
    customOcclusal?: string;
    contactType: string;
    customContact?: string;
    ponticType: string;
    customPontic?: string;
  }) => void;
  initialCaseDetails?: {
    occlusalType: string;
    customOcclusal?: string;
    contactType: string;
    customContact?: string;
    ponticType: string;
    customPontic?: string;
  };
}

interface ToothItem {
  id: string;
  teeth: number[];
  isRange: boolean;
  type: string;
  productName: string;
  highlightColor?: string;
  shades?: ShadeData;
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedMaterial,
  onAddToCase,
  selectedProducts,
  onProductsChange,
  onMaterialChange,
  onCaseDetailsChange,
  initialCaseDetails
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithShade | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [addedTeethMap, setAddedTeethMap] = useState<Map<number, boolean>>(new Map());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shadeType, setShadeType] = useState<'1' | '2' | '3'>('1');
  const [shadeData, setShadeData] = useState<ShadeData>({
    occlusal: '',
    body: '',
    gingival: '',
    stump: ''
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
  const [toothSelectorKey, setToothSelectorKey] = useState(0);

  // Preview state for the Add Shade table
  const [previewItem, setPreviewItem] = useState<ToothItem | null>(null);
  const [previewProduct, setPreviewProduct] = useState<ProductWithShade | null>(null);
  const [isReadyToAdd, setIsReadyToAdd] = useState(false);

  const [shadePopoverOpen, setShadePopoverOpen] = useState(false);

  const [occlusalDetails, setOcclusalDetails] = useState('');
  const [contactType, setContactType] = useState('na');
  const [customContact, setCustomContact] = useState('');
  const [ponticDetails, setPonticDetails] = useState('');

  // Case-level details state
  const [caseDetails, setCaseDetails] = useState<{
    occlusalType: string;
    customOcclusal?: string;
    contactType: string;
    customContact?: string;
    ponticType: string;
    customPontic?: string;
  }>(
    initialCaseDetails || {
      occlusalType: '',
      contactType: '',
      ponticType: ''
    }
  );

  const [productNotes, setProductNotes] = useState<Record<string, string>>({});
  const [previewNote, setPreviewNote] = useState<string>('');
  const [notePopoverOpen, setNotePopoverOpen] = useState<string | null>(null);

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
        console.log('Fetching products...');
        const fetchedProducts = await productsService.getProducts();
        console.log('Fetched products:', fetchedProducts.map(p => ({
          id: p.id,
          name: p.name,
          material: p.material,
          type: p.type
        })));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);  // Only fetch on mount, we'll filter in useMemo

  const filteredProducts = useMemo(() => {
    console.log('Filtering products:', { 
      totalProducts: products.length,
      selectedMaterial,
      selectedType,
      materials: MATERIALS 
    });
    
    if (!products) return [];
    
    return products.filter(product => {
      // First filter by material if selected
      const materialMatches = !selectedMaterial || product.material === selectedMaterial;
      
      // Then filter by type if selected
      const typeMatches = !selectedType || 
        (product.type && Array.isArray(product.type) && 
         product.type.some(t => t.toLowerCase() === selectedType?.toLowerCase()));
      
      const result = materialMatches && typeMatches;
      
      if (result) {
        console.log('Product matched filters:', {
          name: product.name,
          material: product.material,
          type: product.type,
          materialMatches,
          typeMatches
        });
      }
      
      return result;
    });
  }, [products, selectedMaterial, selectedType]);

  useEffect(() => {
    console.log('Selected material changed:', selectedMaterial);
    setSelectedProduct(null);
    setSelectedTeeth([]);
    setShadeData({ occlusal: '', body: '', gingival: '', stump: '' });
    setDiscount(0);
    setErrors({});
    if (selectedMaterial) {
      // Set initial type based on material
      setSelectedType(PRODUCT_TYPES[0]);
    } else {
      setSelectedType(null);
    }
  }, [selectedMaterial]);

  useEffect(() => {
    if (selectedType) {
      console.log('Selected type changed:', selectedType);
      const newPreviewProduct: ProductWithShade = {
        id: 'preview',
        name: selectedType,
        type: selectedType,
        teeth: selectedTeeth,
        material: '',
        shades: {
          occlusal: '',
          body: '',
          gingival: '',
          stump: ''
        },
        price: 0,
        discount: 0,
        notes: '',
        requiresShade: true
      };
      console.log('Setting initial preview product:', newPreviewProduct);
      setPreviewProduct(newPreviewProduct);
    } else {
      setPreviewProduct(null);
    }
  }, [selectedType, selectedTeeth]);

  useEffect(() => {
    onCaseDetailsChange(caseDetails);
  }, [caseDetails, onCaseDetailsChange]);

  const handleProductSelect = (value: string, keepTeeth = false, itemId?: string) => {
    const product = products.find(p => p.id === value) || null;
    console.log('handleProductSelect called:', {
      productId: value,
      keepTeeth,
      itemId,
      foundProduct: product?.name,
      currentTeeth: selectedTeeth
    });
    
    if (product && !['perTooth', 'perArch', 'teeth', 'generic', 'calculate'].includes(product.billingType)) {
      console.error('Invalid billing type:', product.billingType);
      toast.error('Invalid product configuration');
      return;
    }

    setSelectedProduct(product);
    
    if (itemId) {
      setToothItems(prev => prev.map(prevItem => 
        prevItem.id === itemId 
          ? { ...prevItem, productName: product?.name || prevItem.productName }
          : prevItem
      ));
    }
    
    if (!keepTeeth && !itemId) {
      setSelectedTeeth([]);
    }
    
    if (product) {
      const newPreviewProduct: ProductWithShade = {
        ...product,
        id: 'preview',
        teeth: selectedTeeth,
        shades: {
          occlusal: '',
          body: '',
          gingival: '',
          stump: ''
        },
        requiresShade: true
      };
      console.log('Setting new preview product:', newPreviewProduct);
      setPreviewProduct(newPreviewProduct);
      
      // Reset shades when changing products
      setShadeData({ occlusal: '', body: '', gingival: '', stump: '' });
    } else {
      setPreviewProduct(null);
    }
    
    setErrors({});
    checkIfReadyToAdd();
  };

  const handleMaterialSelect = (value: string) => {
    const material = value as ProductMaterial;
    setSelectedMaterialState(material);
    if (onMaterialChange) {
      onMaterialChange(material);
    }
  };

  // Helper function to check if teeth overlap with existing bridge products
  const checkBridgeOverlap = (teeth: number[]): boolean => {
    // Find all bridge items
    const bridgeItems = toothItems.filter(item => item.type === 'Bridge');
    
    // Check if any of the selected teeth overlap with bridge items
    return bridgeItems.some(bridge => 
      teeth.some(tooth => bridge.teeth.includes(tooth))
    );
  };

  const handleToothSelectionChange = (teeth: number[], ponticTeeth?: number[]) => {
    console.log('Teeth selection changed:', teeth);
    
    // Only validate same arch for Bridge products
    if (selectedType === 'Bridge') {
      const isUpperArch = teeth.every(t => t >= 11 && t <= 28);
      const isLowerArch = teeth.every(t => t >= 31 && t <= 48);
      
      if (teeth.length > 0 && !isUpperArch && !isLowerArch) {
        toast.error('For bridges, please select teeth from the same arch');
        return;
      }

      const hasBridgeOverlap = checkBridgeOverlap(teeth);
      if (hasBridgeOverlap) {
        toast.error('Selected teeth overlap with an existing bridge');
        return;
      }
    }
    
    setSelectedTeeth(teeth);
    setErrors(prev => ({ ...prev, teeth: undefined }));
    if (previewItem && previewProduct) {
      const sortedTeeth = [...teeth].sort((a, b) => a - b);
      setPreviewItem(prev => ({
        ...prev!,
        teeth: sortedTeeth,
        isRange: teeth.length > 1
      }));
      
      // Update preview product with new teeth
      setPreviewProduct(prev => ({
        ...prev!,
        teeth: sortedTeeth
      }));
    }
    
    checkIfReadyToAdd();
  };

  const handleShadeChange = (key: keyof ShadeData, value: string) => {
    setShadeData(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (previewProduct) {
      const updatedShades = {
        occlusal: key === 'occlusal' ? value : shadeData.occlusal,
        body: key === 'body' ? value : shadeData.middle,
        gingival: key === 'gingival' ? value : shadeData.gingival,
        stump: key === 'stump' ? value : shadeData.stump
      };
      
      setPreviewProduct(prev => ({
        ...prev!,
        shades: updatedShades
      }));
    }
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
      shades: selectedProduct?.requiresShade ? shadeData : undefined,
      discount,
    };

    onAddToCase(productToAdd);
    
    // Reset form
    setSelectedProduct(null);
    setSelectedTeeth([]);
    setShadeData({ occlusal: '', body: '', gingival: '', stump: '' });
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
    if (!selectedType || selectedTeeth.length === 0) {
      toast.error('Please select teeth before adding');
      return;
    }

    // For bridge products, combine selected teeth and pontic teeth
    let allTeeth = [...teeth];
    if (selectedType === 'Bridge' && ponticTeeth?.length) {
      allTeeth = [...teeth, ...ponticTeeth].sort((a, b) => a - b);
    }

    const sortedTeeth = allTeeth;
    const isRange = allTeeth.length > 1;
    
    // For bridge type, check if the new selection overlaps with any existing bridge
    if (selectedType.toLowerCase() === 'bridge') {
      const hasOverlappingBridge = toothItems.some(item => {
        if (item.type.toLowerCase() !== 'bridge') return false;
        return item.teeth.some(tooth => sortedTeeth.includes(tooth));
      });
      
      if (hasOverlappingBridge) {
        toast.error('This selection overlaps with an existing bridge');
        return;
      }
    } else {
      // For non-bridge types, check for any duplicate teeth
      const hasOverlap = sortedTeeth.some(tooth => addedTeethMap.has(tooth));
      if (hasOverlap) {
        toast.error('Some teeth are already added');
        return;
      }
    }

    const newId = uuidv4();

    // Create new tooth item with basic information
    const newItem: ToothItem = {
      id: newId,
      teeth: sortedTeeth,
      isRange,
      type: selectedType,
      productName: selectedType,
      highlightColor: 'bg-blue-50',
      shades: {
        occlusal: shadeData.occlusal || '',
        body: shadeData.body || '',
        gingival: shadeData.gingival || '',
        stump: shadeData.stump || ''
      }
    };

    // Create new product for the selected products list
    const newProduct: ProductWithShade = {
      id: newId,
      name: selectedType,
      type: selectedType,
      teeth: sortedTeeth,
      material: '',
      shades: {
        occlusal: shadeData.occlusal || '',
        body: shadeData.body || '',
        gingival: shadeData.gingival || '',
        stump: shadeData.stump || ''
      },
      price: 0,
      discount: 0,
      notes: previewNote || '' // Add the note to the product
    };

    // Update states
    const newMap = new Map(addedTeethMap);
    sortedTeeth.forEach(tooth => {
      newMap.set(tooth, isRange);
    });

    if (previewNote) {
      setProductNotes(prev => ({
        ...prev,
        [newId]: previewNote
      }));
    }

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

    // Reset selections and force ToothSelector remount
    setSelectedTeeth([]);
    setShadeData({ occlusal: '', body: '', gingival: '', stump: '' });
    setPreviewNote('');
    setNotePopoverOpen(null);
    setToothSelectorKey(prev => prev + 1);
  };

  const handleShadeSelect = (itemId: string, type: 'occlusal' | 'body' | 'gingival' | 'stump', shade: string) => {
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

  const formatShades = (shades?: { occlusal?: string, body?: string, gingival?: string, stump?: string }) => {
    if (!shades) return '';
    const values = [shades.occlusal || '-', shades.body || '-', shades.gingival || '-', shades.stump || '-'];
    return values.join('/');
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

    // For Bridge products, check overlap
    if (selectedType === 'Bridge') {
      const hasBridgeOverlap = checkBridgeOverlap(selectedTeeth);
      if (hasBridgeOverlap) {
        toast.error('Selected teeth overlap with an existing bridge');
        return;
      }
    }

    // Create new tooth item
    const newItem: ToothItem = {
      id: uuidv4(),
      teeth: selectedTeeth,
      isRange: selectedTeeth.length > 1,
      type: selectedType,
    };

    // Only update the teeth map for bridge products
    if (selectedType === 'Bridge') {
      const newMap = new Map(addedTeethMap);
      selectedTeeth.forEach(tooth => {
        newMap.set(tooth, true);
      });
      setAddedTeethMap(newMap);
    }

    setToothItems(prev => [...prev, newItem]);
    setSelectedTeeth([]); // Reset selected teeth
  };

  const checkIfReadyToAdd = () => {
    const hasTeeth = selectedTeeth.length > 0;
    const hasProduct = selectedProduct !== null;
    const hasShades = selectedProduct?.requiresShade 
      ? Object.values(shadeData).some(shade => shade !== '')
      : true;
    
    setIsReadyToAdd(hasTeeth && hasProduct && hasShades);
  };

  const handleSaveShades = () => {
    console.log('Saving shades:', {
      currentShades: shadeData,
      previewProduct,
      selectedTeeth,
      selectedType,
      selectedProduct
    });

    if (!previewProduct) {
      console.error('No preview product available');
      return;
    }

    if (!selectedTeeth.length) {
      console.error('No teeth selected');
      return;
    }

    // Create a new preview product with updated shades
    const updatedPreviewProduct = {
      ...previewProduct,
      shades: {
        occlusal: shadeData.occlusal || '',
        body: shadeData.body || '',
        gingival: shadeData.gingival || '',
        stump: shadeData.stump || ''
      }
    };

    console.log('Updated preview product:', updatedPreviewProduct);
    
    // Update the preview product state
    setPreviewProduct(updatedPreviewProduct);
    
    // Close the shade popover
    setShadePopoverOpen(false);
    
    // Add the product to the table with shades
    handleAddPreviewToTable(updatedPreviewProduct);
  };

  const handleAddPreviewToTable = (productToAdd = previewProduct) => {
    console.log('Adding preview to table:', {
      productToAdd,
      selectedTeeth,
      selectedType,
      selectedProduct,
      currentShades: shadeData
    });

    if (!productToAdd || !selectedTeeth.length) {
      console.error('Missing required data:', { productToAdd, selectedTeeth });
      return;
    }

    // Check for overlapping teeth only for bridge type
    if (selectedType === 'Bridge') {
      const hasOverlap = selectedTeeth.some(tooth => addedTeethMap.has(tooth));
      if (hasOverlap) {
        toast.error('Bridge teeth cannot overlap with existing selections');
        return;
      }
    }

    const newItem: ToothItem = {
      id: uuidv4(),
      teeth: [...selectedTeeth],
      type: selectedType || '',
      productName: selectedProduct?.name || '',
      isRange: false,
      shades: productToAdd.shades // Use the shades from the productToAdd
    };
    console.log('Created new item:', newItem);

    // Update the teeth map only for bridge type
    if (selectedType === 'Bridge') {
      const newMap = new Map(addedTeethMap);
      selectedTeeth.forEach(tooth => {
        newMap.set(tooth, true);
      });
      setAddedTeethMap(newMap);
    }

    setToothItems(prev => {
      const updated = [...prev, newItem];
      console.log('Updated tooth items:', updated);
      return updated;
    });
    
    // Update selected products
    const newProduct: ProductWithShade = {
      ...productToAdd,
      id: newItem.id,
      teeth: [...selectedTeeth]
    };
    onProductsChange([...selectedProducts, newProduct]);

    setHighlightedItems(prev => new Set([...prev, newItem.id]));

    // Reset states
    setSelectedTeeth([]);
    setSelectedProduct(null);
    setPreviewProduct(null);
    setShadeData({ occlusal: '', body: '', gingival: '', stump: '' });
    setErrors({});

    // Remove highlight after animation
    setTimeout(() => {
      setHighlightedItems(prev => {
        const next = new Set(prev);
        next.delete(newItem.id);
        return next;
      });
    }, 2000);
  };

  const handleRemoveToothItem = (itemId: string) => {
    // Remove the item from toothItems
    setToothItems(prev => prev.filter(item => item.id !== itemId));
    
    // Remove the teeth from addedTeethMap only if it was a bridge
    const itemToRemove = toothItems.find(item => item.id === itemId);
    if (itemToRemove && itemToRemove.type === 'Bridge') {
      const newMap = new Map(addedTeethMap);
      itemToRemove.teeth.forEach(tooth => {
        newMap.delete(tooth);
      });
      setAddedTeethMap(newMap);
    }

    // Remove from selected products
    onProductsChange(selectedProducts.filter(p => p.id !== itemId));
  };

  const handleCancelShades = () => {
    // Reset shades to preview product's shades or empty
    setShadeData({
      occlusal: previewProduct?.shades?.occlusal || '',
      body: previewProduct?.shades?.body || '',
      gingival: previewProduct?.shades?.gingival || '',
      stump: previewProduct?.shades?.stump || ''
    });
    setShadePopoverOpen(false);
  };

  const resetToothSelector = () => {
    setSelectedTeeth([]);
    setToothSelectorKey(prev => prev + 1); // Force remount of ToothSelector
  };

  const handleCaseDetailChange = (
    field: keyof {
      occlusalType: string;
      customOcclusal?: string;
      contactType: string;
      customContact?: string;
      ponticType: string;
      customPontic?: string;
    },
    value: string
  ) => {
    setCaseDetails(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear custom fields when non-custom option is selected
      if (field === 'occlusalType' && value !== 'Custom') {
        delete updated.customOcclusal;
      }
      if (field === 'contactType' && value !== 'Custom') {
        delete updated.customContact;
      }
      if (field === 'ponticType' && value !== 'Custom') {
        delete updated.customPontic;
      }
      
      return updated;
    });
  };

  const PONTIC_INFO = {
    [PonticType.WashThrough]: {
      description: "A pontic design that allows for easy cleaning underneath, ideal for hygienic maintenance.",
      imagePath: "/src/assets/pontics/wash-through.png"
    },
    [PonticType.Dome]: {
      description: "A rounded, convex design that makes minimal contact with the ridge.",
      imagePath: "/src/assets/pontics/dome.png"
    },
    [PonticType.ModifiedRidgeLap]: {
      description: "A modified design that provides some tissue contact while maintaining cleanability.",
      imagePath: "/src/assets/pontics/modified-ridge-lap.png"
    },
    [PonticType.RidgeLapFullSaddle]: {
      description: "Full contact with the ridge, providing maximum aesthetics but requiring careful hygiene.",
      imagePath: "/src/assets/pontics/ridge-lap.png"
    },
    [PonticType.Ovate]: {
      description: "An egg-shaped design that creates natural emergence profile and optimal aesthetics.",
      imagePath: "/src/assets/pontics/ovate.png"
    }
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
              <Label className="text-xs">Select Type:</Label>
              <div className="flex flex-col space-y-1 mt-2.5">
                {PRODUCT_TYPES.map(type => (
                  <Button
                    key={type}
                    variant="default"
                    style={selectedType === type ? {
                      backgroundColor: TYPE_COLORS[type],
                      color: 'white'
                    } : {
                      backgroundColor: 'white',
                      color: 'rgb(55 65 81)' // text-gray-700
                    }}
                    className={cn(
                      "justify-start text-left h-auto py-2 px-3 w-full text-xs",
                      selectedType === type 
                        ? "hover:opacity-90" 
                        : "hover:bg-gray-50"
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
              <Label className="text-xs">Select Teeth:</Label>

              <div className="border rounded-lg p-3 bg-white mt-2.5 min-h-[400px]">
                <ToothSelector
                  key={toothSelectorKey}
                  billingType={selectedProduct?.billingType || 'perTooth'}
                  selectedTeeth={selectedTeeth}
                  onSelectionChange={handleToothSelectionChange}
                  addedTeethMap={addedTeethMap}
                  disabled={false}
                  selectedProduct={selectedProduct || { type: selectedType ? [selectedType] : [] }}
                  onAddToShadeTable={() => handleAddToothItems(selectedTeeth)}
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
            <div className="col-span-7 pl-4">
              <div className="space-y-4">
                {/* Add Shade Table */}
                <div>
                  <Label className="text-xs">Add Material, Item, and Shade:</Label>

                  <div className="border rounded-lg bg-white mt-2.5">
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
                        {/* Preview Row */}
                        <TableRow
                          className="relative bg-yellow-50"
                        >
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            {selectedType || '-'}
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator orientation="vertical" className="h-full" />
                          </TableCell>
                          <TableCell className="text-xs py-1.5 pl-4 pr-0">
                            {selectedTeeth.length > 0 ? formatTeethRange(selectedTeeth) : '-'}
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator orientation="vertical" className="h-full" />
                          </TableCell>
                          <TableCell className="py-1.5 pl-4 pr-0">
                            <MultiColumnProductSelector
                              materials={MATERIALS}
                              products={filteredProducts}
                              selectedProduct={selectedProduct}
                              onProductSelect={(product) => {
                                handleProductSelect(product.id, true);
                              }}
                              disabled={loading || selectedTeeth.length === 0}
                              size="xs"
                            />
                          </TableCell>
                          <TableCell className="w-[1px] p-0">
                            <Separator orientation="vertical" className="h-full" />
                          </TableCell>
                          <TableCell className="py-1.5 pl-4 pr-0">
                            {selectedProduct && (
                              <div className="flex flex-col space-y-0.5">
                                <Popover open={shadePopoverOpen} onOpenChange={setShadePopoverOpen}>
                                  <PopoverTrigger asChild>
                                    {previewProduct?.requiresShade ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={selectedTeeth.length === 0 || !selectedProduct}
                                      >
                                        Add Shade
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-gray-400"
                                        disabled={selectedTeeth.length === 0 || !selectedProduct}
                                      >
                                        -/-/-/-
                                      </Button>
                                    )}
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Shades</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Set the shades for different areas
                                        </p>
                                      </div>
                                      <div className="grid gap-2">
                                        <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="occlusal">Occlusal</Label>
                                          <Select
                                            value={shadeData.occlusal}
                                            onValueChange={(value) => setShadeData(prev => ({ ...prev, occlusal: value }))}
                                          >
                                            <SelectTrigger className="col-span-2">
                                              <SelectValue placeholder="Select shade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <ScrollArea className="h-[200px]">
                                                {VITA_CLASSICAL_SHADES.map((shade) => (
                                                  <SelectItem key={shade} value={shade}>
                                                    {shade}
                                                  </SelectItem>
                                                ))}
                                              </ScrollArea>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="body">Body</Label>
                                          <Select
                                            value={shadeData.body}
                                            onValueChange={(value) => setShadeData(prev => ({ ...prev, body: value }))}
                                          >
                                            <SelectTrigger className="col-span-2">
                                              <SelectValue placeholder="Select shade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <ScrollArea className="h-[200px]">
                                                {VITA_CLASSICAL_SHADES.map((shade) => (
                                                  <SelectItem key={shade} value={shade}>
                                                    {shade}
                                                  </SelectItem>
                                                ))}
                                              </ScrollArea>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="gingival">Gingival</Label>
                                          <Select
                                            value={shadeData.gingival}
                                            onValueChange={(value) => setShadeData(prev => ({ ...prev, gingival: value }))}
                                          >
                                            <SelectTrigger className="col-span-2">
                                              <SelectValue placeholder="Select shade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <ScrollArea className="h-[200px]">
                                                {VITA_CLASSICAL_SHADES.map((shade) => (
                                                  <SelectItem key={shade} value={shade}>
                                                    {shade}
                                                  </SelectItem>
                                                ))}
                                              </ScrollArea>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="stump">Stump</Label>
                                          <Select
                                            value={shadeData.stump}
                                            onValueChange={(value) => setShadeData(prev => ({ ...prev, stump: value }))}
                                          >
                                            <SelectTrigger className="col-span-2">
                                              <SelectValue placeholder="Select shade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <ScrollArea className="h-[200px]">
                                                {VITA_CLASSICAL_SHADES.map((shade) => (
                                                  <SelectItem key={shade} value={shade}>
                                                    {shade}
                                                  </SelectItem>
                                                ))}
                                              </ScrollArea>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCancelShades}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveShades}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 pr-4 flex items-center space-x-1">
                            {selectedTeeth.length > 0 && selectedProduct && (
                              <>
                                <Popover open={notePopoverOpen === 'preview'} onOpenChange={(open) => setNotePopoverOpen(open ? 'preview' : null)}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "h-6 w-6",
                                        previewNote && "text-blue-600",
                                        "hover:text-blue-600"
                                      )}
                                    >
                                      <StickyNote className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-3" align="end">
                                    <div className="space-y-2">
                                      <Label className="text-xs">Add Note</Label>
                                      <Textarea
                                        placeholder="Enter note for this product..."
                                        value={previewNote}
                                        onChange={(e) => setPreviewNote(e.target.value)}
                                        className="h-24 text-sm"
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                {(!selectedProduct.requiresShade || previewProduct?.shades) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleAddToothItems(selectedTeeth)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {/* Existing Items */}
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
                              <span className="text-xs">{item.productName}</span>
                            </TableCell>
                            <TableCell className="w-[1px] p-0">
                              <Separator orientation="vertical" className="h-full" />
                            </TableCell>
                            <TableCell className="py-1.5 pl-4 pr-0">
                              <div className="flex flex-col space-y-0.5">
                                {item.shades ? (
                                  <>
                                    {item.shades.occlusal && (
                                      <div className="text-xs">
                                        <span className="text-gray-500">O:</span> {item.shades.occlusal}
                                      </div>
                                    )}
                                    {item.shades.body && (
                                      <div className="text-xs">
                                        <span className="text-gray-500">B:</span> {item.shades.body}
                                      </div>
                                    )}
                                    {item.shades.gingival && (
                                      <div className="text-xs">
                                        <span className="text-gray-500">G:</span> {item.shades.gingival}
                                      </div>
                                    )}
                                    {item.shades.stump && (
                                      <div className="text-xs">
                                        <span className="text-gray-500">S:</span> {item.shades.stump}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">-/-/-/-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5 pr-4 flex items-center space-x-1">
                              <Popover 
                                open={notePopoverOpen === item.id} 
                                onOpenChange={(open) => setNotePopoverOpen(open ? item.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-6 w-6",
                                      productNotes[item.id] && "text-blue-600",
                                      "hover:text-blue-600"
                                    )}
                                  >
                                    <StickyNote className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-3" align="end">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Edit Note</Label>
                                    <Textarea
                                      placeholder="Enter note for this product..."
                                      value={productNotes[item.id] || ''}
                                      onChange={(e) => {
                                        const newNote = e.target.value;
                                        setProductNotes(prev => ({
                                          ...prev,
                                          [item.id]: newNote
                                        }));
                                        // Update the product's notes in the selectedProducts array
                                        const updatedProducts = toothItems.map(p => 
                                          p.id === item.id 
                                            ? { ...p, notes: newNote }
                                            : p
                                        );
                                        setToothItems(updatedProducts);
                                      }}
                                      className="h-24 text-sm"
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveToothItem(item.id)}
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

                {/* Third Column */}
                <div className="flex-1 p-4 flex flex-col">
  

                  <div className="flex items-start justify-between space-x-6">
                    {/* Occlusal Field */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <Label className="text-xs">Occlusal:</Label>
                      <RadioGroup
                        value={caseDetails.occlusalType}
                        onValueChange={(value) => handleCaseDetailChange('occlusalType', value)}
                        className="flex flex-col"
                      >
                        {OCCLUSAL_OPTIONS.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`occlusal-${option}`} />
                            <Label htmlFor={`occlusal-${option}`} className="text-sm pl-2 pr-4">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {caseDetails.occlusalType === 'Custom' && (
                        <Textarea
                          value={caseDetails.customOcclusal || ''}
                          onChange={(e) => handleCaseDetailChange('customOcclusal', e.target.value)}
                          placeholder="Enter custom occlusal details..."
                          className="h-20"
                        />
                      )}
                    </div>

                    <Separator orientation="vertical" className="h-[120px] mx-2" />

                    {/* Contact Field */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <Label className="text-xs">Contact:</Label>
                      <RadioGroup
                        value={caseDetails.contactType}
                        onValueChange={(value) => handleCaseDetailChange('contactType', value)}
                        className="flex flex-col"
                      >
                        {CONTACT_OPTIONS.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`contact-${option}`} />
                            <Label htmlFor={`contact-${option}`} className="text-sm pl-2 pr-4">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {caseDetails.contactType === 'Custom' && (
                        <Textarea
                          value={caseDetails.customContact || ''}
                          onChange={(e) => handleCaseDetailChange('customContact', e.target.value)}
                          placeholder="Enter custom contact details..."
                          className="h-20"
                        />
                      )}
                    </div>

                    <Separator orientation="vertical" className="h-[120px] mx-2" />

                    {/* Pontic Field */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <Label className="text-xs">Pontic:</Label>
                      <RadioGroup
                        value={caseDetails.ponticType}
                        onValueChange={(value) => handleCaseDetailChange('ponticType', value)}
                        className="flex flex-col"
                      >
                        {PONTIC_OPTIONS.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`pontic-${option}`} />
                            {option !== 'N/A' ? (
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Label 
                                    htmlFor={`pontic-${option}`} 
                                    className="text-sm cursor-pointer hover:text-primary pl-2 pr-4"
                                  >
                                    {option}
                                  </Label>
                                </HoverCardTrigger>
                                {option !== PonticType.Custom && (
                                  <HoverCardContent className="w-80">
                                    <div className="flex flex-col gap-2">
                                      <img 
                                        src={PONTIC_INFO[option as keyof typeof PONTIC_INFO]?.imagePath} 
                                        alt={`${option} pontic type`}
                                        className="w-full h-40 object-contain bg-white rounded-md"
                                      />
                                      <p className="text-sm text-muted-foreground">
                                        {PONTIC_INFO[option as keyof typeof PONTIC_INFO]?.description}
                                      </p>
                                    </div>
                                  </HoverCardContent>
                                )}
                              </HoverCard>
                            ) : (
                              <Label 
                                htmlFor={`pontic-${option}`} 
                                className="text-sm pl-2 pr-4"
                              >
                                {option}
                              </Label>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      {caseDetails.ponticType === 'Custom' && (
                        <Textarea
                          value={caseDetails.customPontic || ''}
                          onChange={(e) => handleCaseDetailChange('customPontic', e.target.value)}
                          placeholder="Enter custom pontic details..."
                          className="h-20"
                        />
                      )}
                    </div>
                  </div>
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
                      <Separator orientation="vertical" className="h-8 mx-2" />
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
                      <Separator orientation="vertical" className="h-8 mx-2" />
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