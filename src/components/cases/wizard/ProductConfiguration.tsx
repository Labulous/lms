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
  MarginDesign,
  OcclusalDesign,
  AlloylDesign,
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
import { FormData as CaseFormData } from "./CaseWizard";
import { spawn } from "child_process";
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
const MARGIN_OPTIONS = Object.values(MarginDesign).map((value) => ({
  value,
  label:
    value === MarginDesign.NotApplicable
      ? "N/A"
      : value
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
}));
const OCCLUSION_OPTIONS = Object.values(OcclusalDesign).map((value) => ({
  value,
  label:
    value === OcclusalDesign.NotApplicable
      ? "N/A"
      : value
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
}));
const ALLOY_OPTIONS = Object.values(AlloylDesign).map((value) => ({
  value,
  label:
    value === AlloylDesign.NotApplicable
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
    ponticType?: string;
    customPontic?: string;
    customContact?: string;
    marginDesign?: string;
    customMargin?: string;
    occlusalDesign?: string;
    customOcclusalDesign?: string;
    alloyType?: string;
    customAlloy?: string;
  }) => void;
  initialCaseDetails?: {
    occlusalType?: string;
    customOcclusal?: string;
    contactType?: string;
    ponticType?: string;
    customPontic?: string;
    customContact?: string;
    marginDesign?: string;
    customMargin?: string;
    occlusalDesign?: string;
    customOcclusalDesign?: string;
    alloyType?: string;
    customAlloy?: string;
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

const teethArray = [
  // Upper right to upper left
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,

  // Lower left to lower right
  38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
];

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({
  selectedProducts,
  onCaseDetailsChange,
  initialCaseDetails,
  setselectedProducts,
  formErrors,
}) => {
  const emptyRow: ProductRow = {
    id: uuidv4(),
    type: "",
    teeth: [],
    product: null,
    isComplete: false,
  };

  // Initialize case details with N/A if not already set
  useEffect(() => {
    if (
      !initialCaseDetails?.occlusalType &&
      !initialCaseDetails?.contactType &&
      !initialCaseDetails?.ponticType
    ) {
      onCaseDetailsChange({
        occlusalType: OcclusalType.NotApplicable,
        contactType: ContactType.NotApplicable,
        ponticType: PonticType.NotApplicable,
        marginDesign: MarginDesign.NotApplicable,
        occlusalDesign: OcclusalDesign.NotApplicable,
        alloyType: AlloylDesign.NotApplicable,
      });
    }
  }, [initialCaseDetails, onCaseDetailsChange]);

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null
  );
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [shadeData, setShadeData] = useState<ShadeData[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeInfo[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [shadesItems, setShadesItems] = useState<any[]>([]);
  const [ponticTeeth, setPonticTeeth] = useState<Set<number>>(new Set());
  const [groupSelectedTeethState, setGroupSelectedTeethState] = useState<
    number[][]
  >([]);

  const [notePopoverOpen, setNotePopoverOpen] = useState<Map<number, boolean>>(
    new Map()
  );
  const [shadePopoverOpen, setShadePopoverOpen] = useState<
    Map<number, boolean>
  >(new Map());
  const [percentPopoverOpen, setPercentPopoverOpen] = useState<
    Map<number, boolean>
  >(new Map());
  const [openTypePopover, setOpenTypePopover] = useState<string | null>(null);
  const [openTeethPopover, setOpenTeethPopover] = useState<string | null>(null);
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
  }, []);

  const fetchedProducts = async (selectedType: string) => {
    const selectedId = productTypes.find((item) => item.name === selectedType);
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
        .eq("product_type_id", selectedId?.id)
        .eq("lab_id", lab?.labId)
        .select("*");

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
  useEffect(() => {
    if (selectedType) {
      fetchedProducts(selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    const getShadeOptions = async (labId: string) => {
      const shadeOptions = await fetchShadeOptions(labId);
      if (shadeOptions) {
        console.log("Shade Options:", shadeOptions);
        // Append a custom value to the end of the shades array
        const customShade = { name: "Manual", id: "manual" }; // Example custom value
        setShadesItems([...shadeOptions, customShade]); // Using spread operator to add the custom value at the end
      } else {
        console.log("Failed to fetch shade options.");
      }
    };

    if (lab) {
      getShadeOptions(lab.labId);
    }
  }, [lab]);

  const formatTeethRange = (teeth: number[]): string => {
    if (!teeth.length) return "";

    // Define the sequence for upper and lower teeth based on the provided data
    const teethArray = [
      // Upper right to upper left
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      // Lower left to lower right
      38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
    ];

    // Function to group consecutive teeth based on the sequence
    const getConsecutiveGroups = (teeth: number[]): string[] => {
      if (teeth.length === 0) return [];

      // Sort the teeth based on the order in teethArray
      const sortedTeeth = [...teeth].sort(
        (a, b) => teethArray.indexOf(a) - teethArray.indexOf(b)
      );

      let groups: string[] = [];
      let groupStart = sortedTeeth[0];
      let prev = sortedTeeth[0];

      for (let i = 1; i <= sortedTeeth.length; i++) {
        const current = sortedTeeth[i];

        // Check if the current tooth is consecutive to the previous one in the sequence
        if (teethArray.indexOf(current) !== teethArray.indexOf(prev) + 1) {
          // End of a group
          if (groupStart === prev) {
            groups.push(groupStart.toString());
          } else {
            groups.push(`${groupStart}-${prev}`);
          }
          groupStart = current; // Start a new group
        }
        prev = current;
      }

      return groups;
    };

    // Get consecutive groups of teeth
    const groupedTeeth = getConsecutiveGroups(teeth);

    // If there's only one group, return it
    return groupedTeeth.join(", ");
  };


  const handleProductSelect = (
    value: any,
    keepTeeth = false,
    index?: number
  ) => {
    const product = products.find((p) => p.id === value.id) || null;
    console.log(product, "product");

    if (!product) return;
    setSelectedProduct(product);
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index !== undefined) {
        return prevSelectedProducts.map(
          (selectedProduct: SavedProduct, i: number) => {
            if (i === index) {
              return {
                ...selectedProduct,
                id: product.id,
                name: product.name,
                price: product.price,
              };
            }
            return selectedProduct;
          }
        );
      } else {
        return [
          ...prevSelectedProducts,
          {
            id: product.id,
            name: product.name,
          },
        ];
      }
    });
  };
  const handleCancelShades = (index: number) => {
    setShadePopoverOpen((prev) => {
      const updated = new Map(prev);
      updated.set(index, false);
      return updated;
    });
  };

  const handleProductTypeChange = (
    type: { name: string; id: string },
    index: number
  ) => {
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index >= 0 && index < prevSelectedProducts.length) {
        const updatedProducts = [...prevSelectedProducts];

        updatedProducts[index] = {
          ...updatedProducts[index],
          type: type.name,
          id: "",
          name: "",
        };

        return updatedProducts;
      } else {
        return prevSelectedProducts;
      }
    });

    setSelectedType(type.name);
  };

  console.log(selectedProducts, "selectedProducts");

  const groupSelectedTeeth = (selectedTeeth: number[]) => {
    // Sort selectedTeeth based on their order in teethArray
    const sortedTeeth = selectedTeeth.sort(
      (a, b) => teethArray.indexOf(a) - teethArray.indexOf(b)
    );

    const groups = [];
    let currentGroup = [sortedTeeth[0]];

    for (let i = 1; i < sortedTeeth.length; i++) {
      const prevIndex = teethArray.indexOf(sortedTeeth[i - 1]);
      const currentIndex = teethArray.indexOf(sortedTeeth[i]);

      // Check if the current tooth is contiguous with the previous one
      if (currentIndex === prevIndex + 1) {
        currentGroup.push(sortedTeeth[i]);
      } else {
        // If not contiguous, push the current group to groups and start a new group
        groups.push(currentGroup);
        currentGroup = [sortedTeeth[i]];
      }
    }

    // Push the final group
    if (currentGroup.length) {
      groups.push(currentGroup);
    }

    // Update the state with the grouped teeth
    setGroupSelectedTeethState(groups);

    return groups; // Optional, for debugging or testing
  };
  const handleTeethSelectionChange = (
    teeth: any[],
    pontic_teeth: number[],
    index: number
  ) => {
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index >= 0 && index < prevSelectedProducts.length) {
        let updatedProducts = [...prevSelectedProducts];
        updatedProducts[index] = {
          ...updatedProducts[index],
          teeth,
          pontic_teeth,
        };

        return updatedProducts;
      } else {
        return prevSelectedProducts;
      }
    });
    groupSelectedTeeth(teeth);
  };

  console.log(groupSelectedTeethState, "groupSelectedTeethState");
  const handleSaveShades = (index: number) => {
    const updatedShades = {
      occlusal_shade: shadeData[index]?.occlusal_shade || "",
      body_shade: shadeData[index]?.body_shade || "",
      gingival_shade: shadeData[index]?.gingival_shade || "",
      stump_shade: shadeData[index]?.stump_shade || "",
      custom_body: shadeData[index]?.custom_body || "",
      custom_gingival: shadeData[index]?.custom_gingival || "",
      custom_occlusal: shadeData[index]?.custom_occlusal || "",
      custom_stump: shadeData[index]?.custom_stump || "",
      manual_body: shadeData[index]?.manual_body || "",
      manual_gingival: shadeData[index]?.manual_gingival || "",
      manual_occlusal: shadeData[index]?.manual_occlusal || "",
      manual_stump: shadeData[index]?.manual_stump || "",
    };

    console.log(updatedShades, "updatedShades");

    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index >= 0 && index < prevSelectedProducts.length) {
        const updatedProducts = [...prevSelectedProducts];

        updatedProducts[index] = {
          ...updatedProducts[index],
          shades: updatedShades,
        };

        return updatedProducts;
      } else {
        console.error("Invalid index provided");
        return prevSelectedProducts;
      }
    });

    setShadePopoverOpen((prev) => {
      const updated = new Map(prev);
      updated.set(index, false);
      return updated;
    });
  };

  const handleDiscountChange = (index: number) => {
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      const updatedProducts = [...prevSelectedProducts];

      if (index >= 0 && index < updatedProducts.length) {
        const selectedProduct = updatedProducts[index];

        updatedProducts[index] = {
          ...selectedProduct,
          discount: discount,
        };
      }

      return updatedProducts;
    });
    setDiscount(0);
    setPercentPopoverOpen((prev) => {
      const updated = new Map(prev);
      updated.set(index, false);
      return updated;
    });
  };

  const addNewProduct = () => {
    const hasInvalidProduct = selectedProducts.some(
      (product) => !product.id || !product.type
    );

    if (hasInvalidProduct) {
      toast.error("Please add the teeth and product.");
    } else {
      const newProduct: SavedProduct = {
        id: "",
        name: "",
        type: "",
        teeth: [],
        price: 0,
        shades: {
          body_shade: "",
          gingival_shade: "",
          stump_shade: "",
          occlusal_shade: "",
        },
        discount: 0,
        notes: "",
        quantity: 1,
      };

      setselectedProducts((prevSelectedProducts: SavedProduct[]) => [
        ...prevSelectedProducts,
        newProduct,
      ]);
    }
  };
  const toggleNotePopover = (index: number) => {
    setNotePopoverOpen((prev) =>
      new Map(prev).set(index, !(prev.get(index) || false))
    );
  };

  const toggleShadePopover = (index: number) => {
    setShadePopoverOpen((prev) =>
      new Map(prev).set(index, !(prev.get(index) || false))
    );
  };
  const togglePercentPopover = (index: number) => {
    setPercentPopoverOpen((prev) =>
      new Map(prev).set(index, !(prev.get(index) || false))
    );
  };

  useEffect(() => {
    if (selectedProducts.length > 0) {
      const shades = selectedProducts.map((item) => {
        const obj = {
          body_shade: item.shades?.body_shade
            ? item.shades?.body_shade
            : item.shades?.manual_body &&
              !item.shades.custom_body &&
              !item.shades?.body_shade
            ? "manual"
            : "",

          gingival_shade: item.shades?.gingival_shade
            ? item.shades?.gingival_shade
            : item.shades?.manual_gingival &&
              !item.shades.custom_body &&
              !item.shades?.gingival_shade
            ? "manual"
            : "",
          occlusal_shade: item.shades?.occlusal_shade
            ? item.shades?.occlusal_shade
            : item.shades?.manual_occlusal &&
              !item.shades.custom_occlusal &&
              !item.shades?.occlusal_shade
            ? "manual"
            : "",
          stump_shade: item.shades?.stump_shade
            ? item.shades?.stump_shade
            : item.shades?.manual_stump &&
              !item.shades.custom_stump &&
              !item.shades?.stump_shade
            ? "manual"
            : "",
          id: item.id,
          custom_body: item.shades?.custom_body,
          custom_gingival: item.shades?.custom_gingival,
          custom_occlusal: item.shades?.custom_occlusal,
          custom_stump: item.shades?.custom_stump,
          manual_body: item.shades?.manual_body || "",
          manual_gingival: item.shades?.manual_gingival || "",
          manual_occlusal: item.shades?.manual_occlusal || "",
          manual_stump: item.shades?.manual_stump || "",
        };

        return obj;
      });

      setShadeData(shades);
    } else {
      const newProduct: SavedProduct = {
        id: "",
        name: "",
        type: "",
        teeth: [],
        price: 0,
        shades: {
          body_shade: "",
          gingival_shade: "",
          stump_shade: "",
          occlusal_shade: "",
        },
        discount: 0,
        notes: "",
        quantity: 1,
      };
      setselectedProducts([newProduct]);
    }
  }, selectedProducts);

  console.log(shadesItems, "shadeData");

  const sortedShadesItems = shadesItems.sort((a, b) => {
    // Compare the names in ascending order
    if (a.name === "Custom") return 1; // "Custom" should go to the bottom
    if (b.name === "Custom") return -1; // "Custom" should go to the bottom
    return a.name.localeCompare(b.name); // Default sorting by name (A-Z)
  });

  return (
    <div className="w-full">
      <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
        <h3 className="text-sm font-medium text-white">
          Product Configuration
        </h3>
      </div>
      <div className="p-6 bg-slate-50">
        <div className="border rounded-lg bg-white mb-6">
          <Table>
            <TableHeader className="bg-slate-100 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead className="w-[200px]">Teeth</TableHead>
                <TableHead>Material/Item</TableHead>
                <TableHead>Shades</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Percent</TableHead>
                <TableHead>Quanitity</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts?.map((row, index) => (
                <TableRow key={row.id} className="border">
                  <TableCell className="border-b">
                    <Popover
                      open={openTypePopover === row.id}
                      onOpenChange={(open) => {
                        setOpenTypePopover(open ? row.id : null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full h-9 px-3 py-2 text-sm justify-start font-normal border rounded-md",
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
                              variant={
                                row.type === type.name ? "secondary" : "ghost"
                              }
                              className={cn(
                                "justify-start text-left h-auto py-2 px-3 w-full text-sm",
                                row.type === type.name
                                  ? "hover:opacity-90"
                                  : "hover:bg-gray-50"
                              )}
                              onClick={() => {
                                handleProductTypeChange(type, index);
                                setOpenTypePopover(null);
                              }}
                            >
                              {type.name}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="border-b">
                    <Popover
                      open={openTeethPopover === row.id}
                      onOpenChange={(open) => {
                        setOpenTeethPopover(open ? row.id : null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full h-9 px-3 py-2 text-sm justify-start font-normal border rounded-md",
                            row.teeth.length === 0 && "text-muted-foreground"
                          )}
                          disabled={!row.type}
                        >
                          {row.teeth.length > 0
                            ? formatTeethRange(row.teeth)
                            : "Select Teeth"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[320px] p-2"
                        onEscapeKeyDown={(e) => {
                          e.preventDefault();
                          setOpenTeethPopover(null);
                        }}
                        onInteractOutside={(e) => {
                          e.preventDefault();
                          setOpenTeethPopover(null);
                        }}
                      >
                        <ToothSelector
                          billingType={
                            selectedProduct?.billing_type?.name || "perTooth"
                          }
                          selectedTeeth={row.teeth}
                          onSelectionChange={(teeth, pontic_teeth) => {
                            handleTeethSelectionChange(
                              teeth,
                              pontic_teeth
                                ? (pontic_teeth as number[] | [])
                                : [],
                              index
                            );
                          }}
                          disabled={!row.type}
                          selectedProduct={{
                            type: row.type ? [row.type] : [],
                            selectedPontic: row.pontic_teeth as number[],
                          }}
                          addedTeethMap={new Map()}
                          onAddToShadeTable={() => {}}
                          ponticTeeth={ponticTeeth}
                          setPonticTeeth={setPonticTeeth}
                          groupSelectedTeethState={groupSelectedTeethState}
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="py-1.5 pl-4 pr-0 border-b">
                    <MultiColumnProductSelector
                      materials={MATERIALS}
                      products={products}
                      selectedProduct={{
                        id: selectedProducts[index].id ?? "",
                        name:
                          selectedProducts[index].name.length > 0
                            ? selectedProducts[index].name
                            : "Select a Product",
                      }}
                      onProductSelect={(product) => {
                        handleProductSelect(product, true, index);
                      }}
                      disabled={loading || row.teeth.length === 0}
                      size="xs"
                      onClick={() => fetchedProducts(row.type)}
                    />
                  </TableCell>

                  <TableCell className="py-1.5 pl-4 pr-0 border-b">
                    <div className="flex flex-col space-y-0.5">
                      <Popover open={shadePopoverOpen.get(index) || false}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-7 text-sm ${
                              row.shades?.body_shade ||
                              row.shades?.gingival_shade ||
                              row.shades?.occlusal_shade ||
                              row.shades?.stump_shade
                                ? "text-blue-600"
                                : ""
                            }`}
                            disabled={row.teeth.length === 0}
                            onClick={() => toggleShadePopover(index)}
                          >
                            {row.shades?.body_shade ||
                            row.shades?.gingival_shade ||
                            row.shades?.occlusal_shade ||
                            row.shades?.custom_body ||
                            row.shades?.custom_gingival ||
                            row.shades?.custom_occlusal ||
                            row.shades?.manual_occlusal ||
                            row.shades?.manual_gingival ||
                            row.shades?.manual_body ||
                            row.shades?.manual_stump ||
                            row.shades?.custom_stump ||
                            row.shades?.stump_shade ? (
                              <div>
                                {shadeData[index]?.occlusal_shade === "manual"
                                  ? shadeData[index]?.manual_occlusal
                                  : shadesItems.filter(
                                      (item) =>
                                        item.id ===
                                        shadeData[index]?.occlusal_shade
                                    )[0]?.name || (
                                      <span
                                        className="text-red-600"
                                        title="custom"
                                      >
                                        {shadeData[index]?.custom_occlusal ||
                                          "--"}
                                      </span>
                                    )}
                                /
                                {shadeData[index]?.body_shade === "manual"
                                  ? shadeData[index]?.manual_body
                                  : shadesItems.filter(
                                      (item) =>
                                        item.id === shadeData[index]?.body_shade
                                    )[0]?.name || (
                                      <span
                                        className="text-red-600"
                                        title="custom"
                                      >
                                        {shadeData[index]?.custom_body || "--"}
                                      </span>
                                    )}
                                /
                                {shadeData[index]?.gingival_shade === "manual"
                                  ? shadeData[index]?.manual_gingival
                                  : shadesItems.filter(
                                      (item) =>
                                        item.id ===
                                        shadeData[index]?.gingival_shade
                                    )[0]?.name || (
                                      <span
                                        className="text-red-600"
                                        title="custom"
                                      >
                                        {shadeData[index]?.custom_gingival ||
                                          "--"}
                                      </span>
                                    )}
                                /
                                {shadeData[index]?.stump_shade === "manual"
                                  ? shadeData[index]?.manual_stump
                                  : shadesItems.filter(
                                      (item) =>
                                        item.id ===
                                        shadeData[index]?.stump_shade
                                    )[0]?.name || (
                                      <span
                                        className="text-red-600"
                                        title="custom"
                                      >
                                        {shadeData[index]?.custom_stump || "--"}
                                      </span>
                                    )}
                              </div>
                            ) : (
                              " Add Shade"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-92"
                          onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            setShadePopoverOpen((prev) => {
                              const updated = new Map(prev);
                              updated.set(index, false);
                              return updated;
                            });
                          }}
                          onInteractOutside={(e) => {
                            e.preventDefault();
                            setShadePopoverOpen((prev) => {
                              const updated = new Map(prev);
                              updated.set(index, false);
                              return updated;
                            });
                          }}
                        >
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">
                                Shades
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Set the shades for different areas
                              </p>
                            </div>

                            <div className="grid gap-2">
                              <div className="grid grid-cols-4 items-center gap-4 text-gray-800 text-sm">
                                <h2></h2>
                                <h2>Select</h2>
                                <h2>Manual</h2>
                                <h2>Custom</h2>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="occlusal">Incisal</Label>
                                <Select
                                  value={shadeData[index]?.occlusal_shade || ""}
                                  onValueChange={(value) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        occlusal_shade: value,
                                        manual_occlusal: "",
                                        id: row.id,
                                        custom_occlusal: "",
                                      };
                                      return updatedShadeData;
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="N/A" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sortedShadesItems.map((shade) => (
                                      <SelectItem
                                        key={shade.id}
                                        value={shade.id}
                                      >
                                        {shade.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  type="text"
                                  value={shadeData[index]?.manual_occlusal}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      if (e.target.value) {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_occlusal: e.target.value,
                                          id: row.id,
                                          occlusal_shade: "manual",
                                          custom_occlusal: "",
                                        };
                                      } else {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_occlusal: "",
                                          id: row.id,
                                          occlusal_shade: "",
                                        };
                                      }

                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                                <Input
                                  type="text"
                                  value={shadeData[index]?.custom_occlusal}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        custom_occlusal:
                                          e.target.value.toUpperCase(),
                                        id: row.id,
                                        manual_occlusal: "",
                                        occlusal_shade: "",
                                      };
                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                              </div>

                              {/* Body Shade */}
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="body">Body</Label>
                                <Select
                                  value={shadeData[index]?.body_shade || ""}
                                  onValueChange={(value) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        body_shade: value,
                                        id: row.id,
                                        manual_body: "",
                                        custom_body: "",
                                      };
                                      return updatedShadeData;
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="N/A" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sortedShadesItems.map((shade) => (
                                      <SelectItem
                                        key={shade.id}
                                        value={shade.id}
                                      >
                                        {shade.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  type="text"
                                  value={shadeData[index]?.manual_body}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      if (e.target.value) {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_body: e.target.value,
                                          id: row.id,
                                          body_shade: "manual",
                                          custom_body: "",
                                        };
                                      } else {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_body: "",
                                          id: row.id,
                                          body_shade: "",
                                        };
                                      }
                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                                <Input
                                  type="text"
                                  value={shadeData[index]?.custom_body}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        custom_body:
                                          e.target.value.toUpperCase(),
                                        id: row.id,
                                        body_shade: "",
                                        manual_body: "",
                                      };
                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                              </div>

                              {/* Gingival Shade */}
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="gingival">Gingival</Label>
                                <Select
                                  value={shadeData[index]?.gingival_shade || ""}
                                  onValueChange={(value) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        gingival_shade: value,
                                        manual_gingival: "",
                                        id: row.id,
                                        custom_gingival: "",
                                      };
                                      return updatedShadeData;
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="N/A" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sortedShadesItems.map((shade) => (
                                      <SelectItem
                                        key={shade.id}
                                        value={shade.id}
                                      >
                                        {shade.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  type="text"
                                  value={shadeData[index]?.manual_gingival}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      if (e.target.value) {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_gingival: e.target.value,
                                          id: row.id,
                                          gingival_shade: "manual",
                                          custom_gingival: "",
                                        };
                                      } else {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_gingival: "",
                                          id: row.id,
                                          gingival_shade: "",
                                        };
                                      }
                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                                <Input
                                  type="text"
                                  value={shadeData[index]?.custom_gingival}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        custom_gingival:
                                          e.target.value.toUpperCase(),
                                        id: row.id,
                                        gingival_shade: "",
                                        manual_gingival: "",
                                      };

                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                              </div>

                              {/* Stump Shade */}
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stump">Stump</Label>
                                <Select
                                  value={shadeData[index]?.stump_shade || ""}
                                  onValueChange={(value) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        stump_shade: value,
                                        id: row.id,
                                        manual_stump: "",
                                        custom_stump: "",
                                      };
                                      return updatedShadeData;
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="N/A" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sortedShadesItems.map((shade) => (
                                      <SelectItem
                                        key={shade.id}
                                        value={shade.id}
                                      >
                                        {shade.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  type="text"
                                  value={shadeData[index]?.manual_stump}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      if (e.target.value) {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_stump: e.target.value,
                                          id: row.id,
                                          stump_shade: "manual",
                                          custom_stump: "",
                                        };
                                      } else {
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          manual_stump: "",
                                          id: row.id,
                                          stump_shade: "",
                                        };
                                      }
                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                                <Input
                                  type="text"
                                  value={shadeData[index]?.custom_stump}
                                  onChange={(e) => {
                                    setShadeData((prev) => {
                                      const updatedShadeData = [...prev];
                                      updatedShadeData[index] = {
                                        ...updatedShadeData[index],
                                        custom_stump:
                                          e.target.value.toUpperCase(),
                                        id: row.id,
                                        stump_shade: "",
                                        manual_stump: "",
                                      };

                                      return updatedShadeData;
                                    });
                                  }}
                                  className="w-20 h-7 text-sm bg-white"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelShades(index)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveShades(index)}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                  <TableCell className=" border-b">
                    <Popover open={notePopoverOpen.get(index) || false}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6",
                            row.notes ? "text-blue-600" : "",
                            "hover:text-blue-600"
                          )}
                          disabled={!row.id}
                          onClick={() => toggleNotePopover(index)}
                        >
                          <StickyNote className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 p-3"
                        onEscapeKeyDown={(e) => {
                          e.preventDefault();
                          setNotePopoverOpen((prev) => {
                            const updated = new Map(prev);
                            updated.set(index, false);
                            return updated;
                          });
                        }}
                        onInteractOutside={(e) => {
                          e.preventDefault();
                          setNotePopoverOpen((prev) => {
                            const updated = new Map(prev);
                            updated.set(index, false);
                            return updated;
                          });
                        }}
                        align="end"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between w-full">
                            <Label className="text-xs">Add Note</Label>
                            <Button
                              size="sm"
                              onClick={() =>
                                setNotePopoverOpen((prev) => {
                                  const updated = new Map(prev);
                                  updated.set(index, false);
                                  return updated;
                                })
                              }
                            >
                              Save
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Enter note for this product..."
                            value={selectedProducts[index].notes ?? ""}
                            onChange={(e) => {
                              const newNote = e.target.value;

                              setselectedProducts(
                                (prevSelectedProducts: SavedProduct[]) => {
                                  const updatedProducts = [
                                    ...prevSelectedProducts,
                                  ];

                                  if (
                                    index >= 0 &&
                                    index < updatedProducts.length
                                  ) {
                                    updatedProducts[index] = {
                                      ...updatedProducts[index],
                                      notes: newNote,
                                    };
                                  }

                                  return updatedProducts;
                                }
                              );
                            }}
                            className="h-24 text-sm"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="border-b">
                    <Popover open={percentPopoverOpen.get(index) || false}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6",
                            selectedProducts?.[index]?.discount !== 0
                              ? "text-blue-600"
                              : "",
                            "hover:text-blue-600"
                          )}
                          disabled={!row.id}
                          onClick={() => togglePercentPopover(index)}
                        >
                         {selectedProducts?.[index]?.discount} <Percent className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 p-3"
                        onEscapeKeyDown={(e) => {
                          e.preventDefault();
                          setPercentPopoverOpen((prev) => {
                            const updated = new Map(prev);
                            updated.set(index, false);
                            return updated;
                          });
                        }}
                        onInteractOutside={(e) => {
                          e.preventDefault();
                          setPercentPopoverOpen((prev) => {
                            const updated = new Map(prev);
                            updated.set(index, false);
                            return updated;
                          });
                        }}
                        align="end"
                      >
                        <div className="flex flex-col justify-between">
                          <div className="flex justify-between">
                            <Label className="text-xs">Add Discount</Label>
                            <Button
                              size="sm"
                              onClick={() => {
                                handleDiscountChange(index);
                              }}
                            >
                              Save
                            </Button>
                          </div>

                          {row.price && (
                            <>
                              <Separator className="mt-2" />
                              <div className="mt-4 flex justify-between space-x-4">
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    Price
                                  </Label>
                                  <p className="text-sm font-medium">
                                    ${row.price.toFixed(2)}
                                  </p>
                                </div>
                                <Separator
                                  orientation="vertical"
                                  className="h-8 mx-2"
                                />
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    Discount (%)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={row.discount}
                                    onChange={(e) => {
                                      const updatedDiscount = Number(
                                        e.target.value
                                      );

                                      setDiscount(updatedDiscount);

                                      setselectedProducts(
                                        (
                                          prevSelectedProducts: SavedProduct[]
                                        ) => {
                                          const updatedProducts = [
                                            ...prevSelectedProducts,
                                          ];

                                          updatedProducts[index] = {
                                            ...updatedProducts[index],
                                            discount: updatedDiscount,
                                          };

                                          return updatedProducts;
                                        }
                                      );
                                    }}
                                    className="w-20 h-7 text-sm bg-white"
                                  />
                                </div>
                                <Separator
                                  orientation="vertical"
                                  className="h-8 mx-2"
                                />
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    Total
                                  </Label>
                                  <p className="text-sm font-extrabold text-blue-500">
                                    $
                                    {(row.price * (1 - discount / 100)).toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="border-b">
                    <Input
                      type="number"
                      value={selectedProducts[index].quantity || 1}
                      onChange={(e) => {
                        const updatedProducts = [...selectedProducts];
                        updatedProducts[index].quantity = Number(
                          e.target.value
                        );
                        setselectedProducts(updatedProducts);
                      }}
                      placeholder="Quantity"
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell className="border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedProducts = selectedProducts.filter(
                          (_, i) => i !== index
                        );
                        setselectedProducts(updatedProducts);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <div className="flex justify-end py-4 px-4">
              <Button
                variant="outline"
                onClick={addNewProduct}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                + Add Product Row
              </Button>
            </div>

            {formErrors.itemsError && (
              <p className="mt-1 text-sm text-red-600 p-3 pr-0">
                {formErrors.itemsError}
              </p>
            )}
          </Table>
        </div>

        {/* Case Details Section */}
        <div className="grid grid-cols-2 gap-5">
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
                    onValueChange={(value) =>
                      onCaseDetailsChange({
                        ...initialCaseDetails,
                        occlusalType: value,
                      })
                    }
                    className="mt-2 space-y-1"
                  >
                    {OCCLUSAL_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`occlusal-${option.value}`}
                        />
                        <Label htmlFor={`occlusal-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}

                    {formErrors?.caseDetails?.occlusalType && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors?.caseDetails?.occlusalType}
                      </p>
                    )}
                  </RadioGroup>
                  {initialCaseDetails?.occlusalType === OcclusalType.Custom && (
                    <Input
                      value={initialCaseDetails?.customOcclusal || ""}
                      onChange={(e) =>
                        onCaseDetailsChange({
                          ...initialCaseDetails,
                          customOcclusal: e.target.value,
                        })
                      }
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
                    onValueChange={(value) =>
                      onCaseDetailsChange({
                        ...initialCaseDetails,
                        contactType: value,
                      })
                    }
                    className="mt-2 space-y-1"
                  >
                    {CONTACT_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`contact-${option.value}`}
                        />
                        <Label htmlFor={`contact-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    {formErrors?.caseDetails?.contactType && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors?.caseDetails?.contactType}
                      </p>
                    )}
                  </RadioGroup>
                  {initialCaseDetails?.contactType === ContactType.Custom && (
                    <Input
                      value={initialCaseDetails?.customContact || ""}
                      onChange={(e) =>
                        onCaseDetailsChange({
                          ...initialCaseDetails,
                          customContact: e.target.value,
                        })
                      }
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
                    onValueChange={(value) =>
                      onCaseDetailsChange({
                        ...initialCaseDetails,
                        ponticType: value,
                      })
                    }
                    className="mt-2 space-y-1"
                  >
                    {PONTIC_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`pontic-${option.value}`}
                        />
                        <Label htmlFor={`pontic-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    {formErrors?.caseDetails?.ponticType && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors?.caseDetails?.ponticType}
                      </p>
                    )}
                  </RadioGroup>
                  {initialCaseDetails?.ponticType === PonticType.Custom && (
                    <Input
                      value={initialCaseDetails?.customPontic || ""}
                      onChange={(e) =>
                        onCaseDetailsChange({
                          ...initialCaseDetails,
                          customPontic: e.target.value,
                        })
                      }
                      placeholder="Enter custom pontic type"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border rounded-lg bg-white">
            <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
              <h3 className="text-sm font-medium text-transparent">
                Case Details
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-xs">Margin Design:</Label>
                  <RadioGroup
                    value={initialCaseDetails?.marginDesign || ""}
                    onValueChange={(value) =>
                      onCaseDetailsChange({
                        ...initialCaseDetails,
                        marginDesign: value,
                      })
                    }
                    className="mt-2 space-y-1"
                  >
                    {MARGIN_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`margin-${option.value}`}
                        />
                        <Label htmlFor={`margin-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    {formErrors?.caseDetails?.marginDesign && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors?.caseDetails?.marginDesign}
                      </p>
                    )}
                  </RadioGroup>
                  {initialCaseDetails?.marginDesign === MarginDesign.Custom && (
                    <Input
                      value={initialCaseDetails?.customMargin || ""}
                      onChange={(e) =>
                        onCaseDetailsChange({
                          ...initialCaseDetails,
                          customMargin: e.target.value,
                        })
                      }
                      placeholder="Enter custom Margin Design"
                      className="mt-2"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs">Occlusion Design:</Label>
                  <RadioGroup
                    value={initialCaseDetails?.occlusalDesign || ""}
                    onValueChange={(value) =>
                      onCaseDetailsChange({
                        ...initialCaseDetails,
                        occlusalDesign: value,
                      })
                    }
                    className="mt-2 space-y-1"
                  >
                    {OCCLUSION_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`occlusion-${option.value}`}
                        />
                        <Label htmlFor={`occlusion-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    {formErrors?.caseDetails?.occlusalDesign && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors?.caseDetails?.occlusalDesign}
                      </p>
                    )}
                  </RadioGroup>
                  {initialCaseDetails?.ponticType === OcclusalDesign.Custom && (
                    <Input
                      value={initialCaseDetails?.customOcclusalDesign || ""}
                      onChange={(e) =>
                        onCaseDetailsChange({
                          ...initialCaseDetails,
                          customOcclusalDesign: e.target.value,
                        })
                      }
                      placeholder="Enter custom pontic type"
                      className="mt-2"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs">Alloy:</Label>
                  <RadioGroup
                    value={initialCaseDetails?.alloyType || ""}
                    onValueChange={(value) =>
                      onCaseDetailsChange({
                        ...initialCaseDetails,
                        alloyType: value,
                      })
                    }
                    className="mt-2 space-y-1"
                  >
                    {ALLOY_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`alloy-${option.value}`}
                        />
                        <Label htmlFor={`alloy-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    {formErrors?.caseDetails?.alloyType && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors?.caseDetails?.alloyType}
                      </p>
                    )}
                  </RadioGroup>
                  {initialCaseDetails?.ponticType === PonticType.Custom && (
                    <Input
                      value={initialCaseDetails?.customAlloy || ""}
                      onChange={(e) =>
                        onCaseDetailsChange({
                          ...initialCaseDetails,
                          customAlloy: e.target.value,
                        })
                      }
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
    </div>
  );
};

export default ProductConfiguration;
