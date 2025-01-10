import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  MATERIALS,
  PRODUCT_TYPES,
  SavedProduct,
  Product,
} from "@/data/mockProductData";
import {
  Material as ProductMaterial,
  ShadeData,
  PonticType,
  OcclusalType,
  ContactType,
  ShadeOption,
  ProductWithShade,
  Database,
} from "@/types/supabase";
import { productsService, ProductTypes } from "@/services/productsService";
import ToothSelector, { TYPE_COLORS } from "./modals/ToothSelector";
import { Input } from "@/components/ui/input";
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
import { X, Plus, StickyNote, Percent } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
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
import MultiColumnProductSelector from "./modals/MultiColumnProductSelector";

import { fetchShadeOptions } from "@/data/mockCasesData";
import { Item } from "@radix-ui/react-dropdown-menu";
import { createClient } from "@supabase/supabase-js";
import { CaseStatus, FormData, ToothInfo } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ProductTypeInfo {
  id: string;
  name: string;
}

interface ToothItem {
  id: string;
  teeth: number[];
  type: string;
  productName: string;
  name?: string;
  highlightColor?: string;
  shades?: ShadeData;
}

type ProductType = Database["public"]["Tables"]["products"]["Row"] & {
  billing_type?: {
    name: string;
  };
};

const OCCLUSAL_OPTIONS = Object.values(OcclusalType).map((value) => ({
  value,
  label:
    value === OcclusalType.NotApplicable
      ? "N/A"
      : value
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
}));

const CONTACT_OPTIONS = Object.values(ContactType).map((value) => ({
  value,
  label:
    value === ContactType.NotApplicable
      ? "N/A"
      : value
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
}));

const PONTIC_OPTIONS = Object.values(PonticType).map((value) => ({
  value,
  label:
    value === PonticType.NotApplicable
      ? "N/A"
      : value
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
}));

interface ProductConfigurationProps {
  selectedMaterial: SavedProduct | null;
  onAddToCase: (product: SavedProduct) => void;
  selectedProducts: SavedProduct[];
  onProductsChange: (products: SavedProduct[]) => void;
  onMaterialChange: (material: SavedProduct | null) => void;
  onCaseDetailsChange: (details: {
    occlusalType?: string;
    customOcclusal?: string;
    contactType?: string;
    customContact?: string;
    ponticType?: string;
    customPontic?: string;
  }) => void;
  initialCaseDetails?: {
    occlusalType?: string;
    customOcclusal?: string;
    contactType?: string;
    customContact?: string;
    ponticType?: string;
    customPontic?: string;
  };
  setselectedProducts: any;
  formData?: FormData;
  formErrors: Partial<FormData>;
}

interface ProductRow {
  id: string;
  type: string | null;
  teeth: number[];
  product: ProductType | null;
  shadeData?: ShadeData;
  isComplete: boolean;
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedMaterial,
  onAddToCase,
  selectedProducts,
  onProductsChange,
  onMaterialChange,
  onCaseDetailsChange,
  initialCaseDetails,
  setselectedProducts,
  formData,
  formErrors,
}) => {
  const emptyRow: ProductRow = {
    id: uuidv4(),
    type: "",
    teeth: [],
    product: null,
    isComplete: false,
  };

  const [productRows, setProductRows] = useState<ProductRow[]>([emptyRow]);

  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [shadeType, setShadeType] = useState<"1" | "2" | "3">("1");
  const [shadeData, setShadeData] = useState<ShadeData>({
    occlusal: "",
    body: "",
    gingival: "",
    stump: "",
  });
  const [toothItems, setToothItems] = useState<ToothItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [errors, setErrors] = useState<{
    product?: string;
    teeth?: string;
    shade?: string;
    type?: string;
  }>({});
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(
    new Set()
  );
  const [openPopoverIds, setOpenPopoverIds] = useState<Set<string>>(new Set());
  const [arch, setArch] = useState<string>("");
  const [selectedMaterialState, setSelectedMaterialState] =
    useState<SavedProduct | null>(selectedMaterial);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [toothSelectorKey, setToothSelectorKey] = useState(0);
  const [productTypes, setProductTypes] = useState<ProductTypeInfo[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [shadesItems, setShadesItems] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProductTypes = async () => {
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData) {
        toast.error("Unable to get Lab Id");
        return null;
      }
      setLab(labData);
      try {
        setLoading(true);

        const fetchedProductTypes = await productsService.getProductTypes(
          labData.labId
        );
        console.log("Fetched product types:", fetchedProductTypes);
        setProductTypes(fetchedProductTypes);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProductTypes();
  }, []); // Only fetch on mount, we'll filter in useMemo

  useEffect(() => {
    const fetchProductTypes = async () => {
      const selectedId = productTypes.find(
        (item) => item.name === selectedType
      );
      console.log(selectedId?.id, "selectedId");
      try {
        setLoading(true);
        const { data: fetchedProducts, error } = await supabase
          .from("products")
          .select(
            `
                  *,
                  material:materials(name),
                  product_type:product_types(name),
                  billing_type:billing_types(name, label)
                `
          )
          .order("name")
          .eq("product_type_id", selectedId?.id).select("*");

        if (error) {
          toast.error("Error fetching products from Supabase");
          throw error;
        }
        console.log(
          "Fetched products:",
          fetchedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            material: p.material,
            type: p.product_type,
          }))
        );
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    if (selectedType) {
      fetchProductTypes();
    }
  }, [selectedType]); // Only fetch on mount, we'll filter in useMemo

  useEffect(() => {
    const getShadeOptions = async (labId: string) => {
      const shadeOptions = await fetchShadeOptions(labId);
      if (shadeOptions) {
        console.log("Shade Options:", shadeOptions);
        setShadesItems(shadeOptions);
      } else {
        console.log("Failed to fetch shade options.");
      }
    };
    if (lab) {
      getShadeOptions(lab.labId);
    }
  }, [lab]);

  useEffect(() => {
    const completeRows = productRows.filter((row) =>
      row.type && row.teeth.length > 0 && row.product
    );

    // Convert rows to saved products format with required fields
    const newProducts = completeRows.map((row) => ({
      id: row.product!.id,
      name: row.product!.name || "",
      type: row.type!,
      teeth: row.teeth,
      shades: {
        occlusal: row.shadeData?.occlusal || "",
        body: row.shadeData?.body || "",
        gingival: row.shadeData?.gingival || "",
        stump: row.shadeData?.stump || ""
      },
      price: row.product!.price || 0,
      discount: 0,
      notes: ""
    }));

    // Update parent form state
    onProductsChange(newProducts);
  }, [productRows, onProductsChange]);

  const updateRow = useCallback((id: string, updates: Partial<ProductRow>) => {
    setProductRows((prev) => {
      const newRows = prev.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      );

      // Check if the last row is being edited
      const lastRow = newRows[newRows.length - 1];
      if (
        lastRow.id === id &&
        (updates.type || (updates.teeth && updates.teeth.length > 0) || updates.product)
      ) {
        // Add a new empty row
        return [...newRows, { ...emptyRow, id: uuidv4() }];
      }

      return newRows;
    });
  }, []);

  // Remove a row by id
  const removeRow = useCallback((id: string) => {
    setProductRows((prev) => {
      const filtered = prev.filter((row) => row.id !== id);
      return filtered.length === 0
        ? [{ ...emptyRow, id: uuidv4() }]
        : filtered;
    });
  }, []);

  // Load initial products when editing existing case
  useEffect(() => {
    if (selectedProducts?.length > 0) {
      const initialRows = selectedProducts.map((product) => ({
        id: uuidv4(),
        type: product.type || "",
        teeth: product.teeth,
        product: products.find(p => p.id === product.id) || null,
        shadeData: product.shades,
        isComplete: true,
      }));

      // Add an empty row at the end
      initialRows.push({ ...emptyRow, id: uuidv4() });

      setProductRows(initialRows);
    }
  }, [selectedProducts, products]);

  const formatTeethRange = (teeth: number[]): string => {
    if (!teeth.length) return "";

    // Check if it's an arch selection
    const hasUpper = teeth.some((t) => t >= 11 && t <= 28);
    const hasLower = teeth.some((t) => t >= 31 && t <= 48);
    const isFullArch = teeth.length >= 16; // Assuming a full arch has at least 16 teeth

    if (isFullArch) {
      if (hasUpper && hasLower) return "All";
      if (hasUpper) return "Upper";
      if (hasLower) return "Lower";
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

    return ranges.join(", ");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
        <h3 className="text-sm font-medium text-white">Product Configuration</h3>
      </div>

      {/* Content Wrapper */}
      <div className="p-6 bg-slate-50">
        {/* Product Table */}
        <div className="border rounded-lg bg-white mb-6">
          <Table>
            <TableHeader className="bg-slate-100 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead className="w-[200px]">Teeth</TableHead>
                <TableHead>Material/Item</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 text-xs w-full justify-start",
                            !row.type && "text-muted-foreground"
                          )}
                        >
                          {row.type || "Select Type"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <div className="grid gap-1">
                          {productTypes.map((type) => (
                            <Button
                              key={type.id}
                              variant={row.type === type.name ? "secondary" : "ghost"}
                              className={cn(
                                "justify-start text-left h-auto py-2 px-3 w-full text-xs",
                                row.type === type.name
                                  ? "hover:opacity-90"
                                  : "hover:bg-gray-50"
                              )}
                              onClick={() => {
                                updateRow(row.id, { type: type.name });
                              }}
                            >
                              {type.name}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 text-xs w-full justify-start",
                            row.teeth.length === 0 && "text-muted-foreground"
                          )}
                          disabled={!row.type}
                        >
                          {row.teeth.length > 0
                            ? formatTeethRange(row.teeth)
                            : "Select Teeth"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-2">
                        <ToothSelector
                          billingType={row.product?.billing_type?.name || "perTooth"}
                          selectedTeeth={row.teeth}
                          onSelectionChange={(teeth) =>
                            updateRow(row.id, { teeth })
                          }
                          disabled={!row.type}
                          selectedProduct={{
                            type: row.type ? [row.type] : [],
                          }}
                          addedTeethMap={new Map()}
                          onAddToShadeTable={() => {}}
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={!row.type || row.teeth.length === 0}
                      value={row.product?.id}
                      onValueChange={(value) => {
                        const product = products.find((p) => p.id === value);
                        updateRow(row.id, { product });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Material/Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {index !== productRows.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Case Details Section */}
        <div className="border rounded-lg bg-white">
          <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
            <h3 className="text-sm font-medium text-white">Case Details</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Occlusal Type */}
              <div>
                <Label className="text-xs">Occlusal Type:</Label>
                <RadioGroup
                  value={initialCaseDetails?.occlusalType || ""}
                  onValueChange={(value) => onCaseDetailsChange({ ...initialCaseDetails, occlusalType: value })}
                  className="mt-2 space-y-1"
                >
                  {OCCLUSAL_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`occlusal-${option.value}`} />
                      <Label htmlFor={`occlusal-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {initialCaseDetails?.occlusalType === OcclusalType.Custom && (
                  <Input
                    value={initialCaseDetails?.customOcclusal || ""}
                    onChange={(e) => onCaseDetailsChange({ 
                      ...initialCaseDetails, 
                      customOcclusal: e.target.value 
                    })}
                    placeholder="Enter custom occlusal type"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Contact Type */}
              <div>
                <Label className="text-xs">Contact Type:</Label>
                <RadioGroup
                  value={initialCaseDetails?.contactType || ""}
                  onValueChange={(value) => onCaseDetailsChange({ ...initialCaseDetails, contactType: value })}
                  className="mt-2 space-y-1"
                >
                  {CONTACT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`contact-${option.value}`} />
                      <Label htmlFor={`contact-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {initialCaseDetails?.contactType === ContactType.Custom && (
                  <Input
                    value={initialCaseDetails?.customContact || ""}
                    onChange={(e) => onCaseDetailsChange({ 
                      ...initialCaseDetails, 
                      customContact: e.target.value 
                    })}
                    placeholder="Enter custom contact type"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Pontic Type */}
              <div>
                <Label className="text-xs">Pontic Type:</Label>
                <RadioGroup
                  value={initialCaseDetails?.ponticType || ""}
                  onValueChange={(value) => onCaseDetailsChange({ ...initialCaseDetails, ponticType: value })}
                  className="mt-2 space-y-1"
                >
                  {PONTIC_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`pontic-${option.value}`} />
                      <Label htmlFor={`pontic-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {initialCaseDetails?.ponticType === PonticType.Custom && (
                  <Input
                    value={initialCaseDetails?.customPontic || ""}
                    onChange={(e) => onCaseDetailsChange({ 
                      ...initialCaseDetails, 
                      customPontic: e.target.value 
                    })}
                    placeholder="Enter custom pontic type"
                    className="mt-2"
                  />
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
