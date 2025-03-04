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
  MaterialType,
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
import {
  X,
  Plus,
  StickyNote,
  Percent,
  Minus,
  Pencil,
  Cross,
  CrossIcon,
} from "lucide-react";
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
import React from "react";
import { Service } from "@/data/mockServiceData";
import MultiColumnServiceSelector from "./modals/MultiColumnServiceSelector";
import { AddProductValuesDialog } from "@/components/settings/AddProductValuesDialog";
import EditProductValuesDialog from "@/components/settings/EditProductValuesDialog";
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

interface Material {
  id: string;
  name: string;
}

interface ServiceType {
  id: string | null;
  name: string;
  price: number;
  is_taxable: boolean;
  material?: Material;
  discount?: number;
  subRows?: {
    services: {
      id: string | null;
      name: string;
      price: number;
      is_taxable: boolean;
      material?: Material;
      discount?: number;
    }[];
  }[];
}
interface SelectedServiceType {
  services: {
    id: string | null;
    name: string;
    price: number;
    is_taxable: boolean;
    material?: Material;
    discount?: number;
    subRows?: {
      services: {
        id: string | null;
        name: string;
        price: number;
        is_taxable: boolean;
        material?: Material;
        discount?: number;
      }[];
    }[];
  }[];
}

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
  onAddToCase: (product: SavedProduct, service: ServiceType) => void;
  selectedProducts: SavedProduct[];
  selectedServices: ServiceType[];
  onProductsChange: (products: SavedProduct[]) => void;
  onServicesChange: (services: ServiceType[]) => void;
  isUpdate?: boolean;
  setIsUpdate?: React.Dispatch<React.SetStateAction<boolean>>;
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
  setselectedServices: any;
  formData?: FormData;
  formErrors: Partial<FormData>;
  clientSpecialProducts: { product_id: string; price: number }[] | null;
  clientSpecialServices: { service_id: string; price: number }[] | null;
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
  isUpdate,
  setIsUpdate,
  selectedServices,
  setselectedServices,
  clientSpecialProducts,
  clientSpecialServices,
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
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shadeData, setShadeData] = useState<ShadeData[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeInfo[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [shadesItems, setShadesItems] = useState<any[]>([]);
  const [isSingleService, setIsSingleService] = useState<boolean>(true);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [SelectedSubServices, setSelectedSubServices] = useState<
    SelectedServiceType[]
  >([]);
  const [ponticTeeth, setPonticTeeth] = useState<Set<number>>(new Set());
  const [groupSelectedTeethState, setGroupSelectedTeethState] = useState<
    number[][]
  >([]);

  const [notePopoverOpen, setNotePopoverOpen] = useState<Map<number, boolean>>(
    new Map()
  );
  const [servicesPopoverOpen, setServicesPopoverOpen] = useState<
    Map<number, boolean>
  >(new Map());
  const [shadePopoverOpen, setShadePopoverOpen] = useState<
    Map<number, boolean>
  >(new Map());
  const [percentPopoverOpen, setPercentPopoverOpen] = useState<
    Map<number, boolean>
  >(new Map());
  const [openTypePopover, setOpenTypePopover] = useState<string | null>(null);
  const [openTeethPopover, setOpenTeethPopover] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState<"product_types" | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<"product_types" | null>(
    null
  );
  const { user } = useAuth();

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const handleOpenDialog = (type: "product_types") => {
    setOpenEditDialog(null); // Close edit dialog if open
    setOpenDialog(type);
  };
  const handleOpenEditDialog = (type: "product_types") => {
    setOpenDialog(null); // Close add dialog if open
    setOpenEditDialog(type);
  };
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newArray = [...prev];
      // Check if the length is 1 and the value is an empty string
      if (newArray.length === 1 && newArray[0] === "") {
        newArray[0] = rowId; // Replace the empty string with the incoming rowId
        return newArray;
      }
      const index = newArray.indexOf(rowId);
      if (index > -1) {
        newArray.splice(index, 1); // Remove the rowId if it's already in the array
      } else {
        newArray.push(rowId); // Add the rowId if it's not in the array
      }
      return newArray;
    });
  };

  const fetchedMaterials = async () => {
    if (!lab?.labId) {
      return;
    }
    try {
      setLoading(true);
      const { data: fetchedProducts, error } = await supabase
        .from("materials")
        .select(
          `
          *
         
        `
        )
        .eq("lab_id", lab?.labId);

      if (error) {
        toast.error("Error fetching products from Supabase");
        throw error;
      }

      setMaterials(
        fetchedProducts.map((item) => ({ id: item.id, name: item.name }))
      );
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };
  const fetchProductTypes = async () => {
    const labData = await getLabIdByUserId(user?.id as string);
    if (!labData) {
      toast.error("Unable to get Lab Id");
      return null;
    }
    console.log(labData, "labData");
    setLab(labData);
    try {
      setLoading(true);

      const fetchedProductTypes = await productsService.getProductTypes(
        labData.labId
      );

      // Adding new fields to productTypes
      const updatedProductTypes = [
        ...fetchedProductTypes,
        { id: "add", name: "Add Product Type" },
      ];

      setProductTypes(updatedProductTypes);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProductTypes();
  }, []);
  console.log(materials, "materials", MATERIALS);
  const fetchedProducts = async (selectedType: string) => {
    const selectedId = productTypes.find((item) => item.name === selectedType);
    try {
      setLoading(true);
      if (!lab?.labId) {
        return;
      }
      const { data: fetchedProducts, error } = await supabase
        .from("products")
        .select(
          `
          *,
          material:materials!material_id (name, id),
          product_type:product_types (name),
          billing_type:billing_types (name, label)
        `
        )
        .order("name")
        .eq("lab_id", lab?.labId);

      if (error) {
        toast.error("Error fetching products from Supabase");
        throw error;
      }

      setProducts(fetchedProducts);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!lab?.labId) {
      return;
    }
    try {
      setLoading(true);
      const { data: fetchedServices, error } = await supabase
        .from("services")
        .select(`*, material:materials!material_id (name, id)`)
        .order("name")
        .eq("lab_id", lab?.labId);

      if (error) {
        toast.error("Error fetching services from Supabase");
        throw error;
      }
      setServices(fetchedServices);
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (selectedType) {
      fetchedProducts(selectedType);
      fetchServices();
    }
  }, [selectedType]);

  useEffect(() => {
    const getShadeOptions = async (labId: string) => {
      const shadeOptions = await fetchShadeOptions(labId);
      if (shadeOptions) {
        // Append a custom value to the end of the shades array
        const customShade = { name: "Manual", id: "manual" }; // Example custom value
        setShadesItems([...shadeOptions, customShade]); // Using spread operator to add the custom value at the end
      }
    };

    if (lab) {
      getShadeOptions(lab.labId);
      fetchedMaterials();
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

    if (!product) return;
    if (!index) {
      toggleRowExpansion(product.id);
    }
    setSelectedProduct(product);
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index !== undefined) {
        let updatedProducts = [...prevSelectedProducts];

        // Update the subRows' product name
        updatedProducts[index] = {
          ...updatedProducts[index],
          name: product.name,
          id: product.id,
          price:
            clientSpecialProducts?.filter(
              (item) => item.product_id === product.id
            )?.[0]?.price || product.price,
          subRows: updatedProducts?.[index]?.subRows?.map((subRow) => ({
            ...subRow,
            name: product.name,
            id: product.id,
            price:
              clientSpecialProducts?.filter(
                (item) => item.product_id === product.id
              )?.[0]?.price || product.price,
            is_taxable: product.is_taxable,
          })),
        };

        return updatedProducts;
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

  const handleServiceSelect = (service: Service, index: number) => {
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      let updatedProducts = [...prevSelectedProducts];

      // Ensure mainServices array exists
      if (!updatedProducts[index].commonServices) {
        updatedProducts[index].commonServices = [];
      }

      updatedProducts[index] = {
        ...updatedProducts[index],
        commonServices: [
          ...(updatedProducts[index].commonServices || []), // Keep existing mainServices
          {
            id: service.id as string,
            name: service.name,
            price:
              clientSpecialServices?.find(
                (item) => item.service_id === service.id
              )?.price || service.price,
            is_taxable: service.is_taxable,
            discount: service.discount || 0,
            add_to_all: false,
          },
        ],
      };
      updatedProducts[index] = {
        ...updatedProducts[index],
        mainServices: [
          ...(updatedProducts[index].mainServices || []), // Keep existing mainServices
          {
            id: service.id as string,
            name: service.name,
            price:
              clientSpecialServices?.find(
                (item) => item.service_id === service.id
              )?.price || service.price,
            is_taxable: service.is_taxable,
            discount: service.discount || 0,
          },
        ],
      };

      return updatedProducts;
    });
  };

  const handleSubServiceSelect = (
    value: any,
    index: number | undefined,
    SubIndex: number = 0
  ) => {
    const service = services.find((p) => p.id === value.id) || null;
    if (!service || index === undefined) return; // Ensure that the service is valid and index is provided

    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      let updatedProducts = [...prevSelectedProducts]; // Make a copy of the products array to avoid mutation

      // Ensure subRows exists at the index and that the SubIndex is valid
      if (updatedProducts[index]?.subRows) {
        let updatedSubRows = [...updatedProducts[index].subRows]; // Make a copy of subRows to avoid mutation

        // Add the service to the main product's services array (if not already there)
        let updatedServices = [...(updatedProducts[index].services || [])];
        const serviceExistsInMain = updatedServices.some(
          (s) => s.id === service.id
        );

        if (!serviceExistsInMain) {
          updatedServices.push({
            id: service.id,
            name: service.name,
            price:
              clientSpecialServices?.filter(
                (item) => item.service_id === service.id
              )?.[0]?.price || service.price,
            is_taxable: service.is_taxable,
            discount: service.discount || (0 as number),
          });
        }

        // Now update the services for the specific subRow
        if (updatedSubRows[SubIndex]?.services) {
          let updatedSubServices = [...updatedSubRows[SubIndex].services];

          // Check if the service already exists in the subRow services array
          const serviceExistsInSub = updatedSubServices.some(
            (s) => s.id === service.id
          );

          if (!serviceExistsInSub) {
            // Add the service if it doesn't exist
            updatedSubServices.push({
              id: service.id,
              name: service.name,
              price:
                clientSpecialServices?.filter(
                  (item) => item.service_id === service.id
                )?.[0]?.price || service.price,
              is_taxable: service.is_taxable,
              discount: service.discount || (0 as number),
            });
          }

          updatedSubRows[SubIndex] = {
            ...updatedSubRows[SubIndex],
            services: updatedSubServices,
          };
        } else {
          // Initialize services at SubIndex if it doesn't exist
          updatedSubRows[SubIndex] = {
            ...updatedSubRows[SubIndex],
            services: [
              {
                id: service.id,
                name: service.name,
                price:
                  clientSpecialServices?.filter(
                    (item) => item.service_id === service.id
                  )?.[0]?.price || service.price,
                is_taxable: service.is_taxable,
                discount: service.discount || (0 as number),
              },
            ],
          };
        }

        // Update the product with the new services and subRows
        updatedProducts[index] = {
          ...updatedProducts[index],
          services: updatedServices, // Update the main product's services array
          subRows: updatedSubRows, // Update subRows
        };

        return updatedProducts;
      }

      return updatedProducts;
    });
  };

  const handleRemoveServices = (
    id: string,
    isMain: boolean,
    isSubIndex?: number
  ) => {
    console.log(isSubIndex, "isSub");
    if (!isMain) {
      setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
        let updatedProducts = prevSelectedProducts.map((product) => {
          // Remove the service from the main services array
          const updatedServices =
            product.services?.filter((service) => service.id !== id) || [];
          console.log(updatedServices, "updatedServices");
          const updatedCommonServices =
            product.commonServices?.filter((service) => service.id !== id) ||
            [];

          // Remove the service from subRows' services array
          const updatedSubRows = product.subRows?.map((subRow, index) => {
            if (index === isSubIndex) {
              return {
                ...subRow,
                services:
                  subRow.services?.filter((service) => service.id !== id) || [],
              };
            }
            return subRow; // Keep other subRows unchanged
          });

          return {
            ...product,
            commonServices: updatedCommonServices,
            services: updatedServices, // Update the main services array
            subRows: updatedSubRows, // Update the subRows with the modified services
          };
        });

        return updatedProducts;
      });
    } else {
      setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
        let updatedProducts = prevSelectedProducts.map((product) => {
          // Remove the service from the main services array
          const updatedServices =
            product.services?.filter((service) => service.id !== id) || [];
          console.log(updatedServices, "updatedServices");
          const updatedCommonServices =
            product.commonServices?.filter((service) => service.id !== id) ||
            [];

          // Remove the service from subRows' services array
          const updatedSubRows = product.subRows?.map((subRow, index) => {
            return {
              ...subRow,
              services:
                subRow.services?.filter((service) => service.id !== id) || [],
            };
            return subRow; // Keep other subRows unchanged
          });

          return {
            ...product,
            commonServices: updatedCommonServices,
            services: updatedServices, // Update the main services array
            subRows: updatedSubRows, // Update the subRows with the modified services
          };
        });

        return updatedProducts;
      });
    }
  };

  const handleProductSubSelect = (
    value: any,
    index?: number,
    SubIndex: number = 0
  ) => {
    const product = products.find((p) => p.id === value.id) || null;
    if (!product) return;
console.log(index,SubIndex,"index subIndex")
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index !== undefined) {
        // Create a copy of the previous selected products to avoid direct mutation
        let updatedProducts = [...prevSelectedProducts];

        // Ensure that subRows exists at the specified index and SubIndex
        if (updatedProducts[index]?.subRows) {
          let updatedSubRows: any = [...updatedProducts[index].subRows]; // Create a new array to avoid mutation

          if (updatedSubRows[SubIndex]) {
            // If subRow at SubIndex exists, update it
            updatedSubRows[SubIndex] = {
              ...updatedSubRows[SubIndex],
              name: product.name,
              id: product.id,
              price:
                clientSpecialProducts?.filter(
                  (item) => item.product_id === product.id
                )?.[0]?.price || product.price,
            };
          } else {
            // If subRow at SubIndex doesn't exist, create a new entry
            updatedSubRows[SubIndex] = {
              name: product.name,
              id: product.id,
              price:
                clientSpecialProducts?.filter(
                  (item) => item.product_id === product.id
                )?.[0]?.price || product.price,
            };
          }

          // Assign the updated subRows back to the selected product
          updatedProducts[index] = {
            ...updatedProducts[index],
            commonServices: [
              ...(updatedProducts[index].commonServices || []), // Ensure it's an array
              {
                id: product.id,
                name: product.name,
                price:
                  clientSpecialProducts?.find(
                    (item) => item.product_id === product.id
                  )?.price || product.price,
                add_to_all: false,
                discount: 0,
                is_taxable: false,
              },
            ],
            subRows: updatedSubRows,
          };

          return updatedProducts;
        } else {
          // If subRows does not exist at all, initialize it with the new item
          updatedProducts[index] = {
            ...updatedProducts[index],
            commonServices: [
              ...(updatedProducts[index].commonServices || []), // Ensure it's an array
              {
                id: product.id,
                name: product.name,
                price:
                  clientSpecialProducts?.find(
                    (item) => item.product_id === product.id
                  )?.price || product.price,
                add_to_all: false,
                discount: 0,
                is_taxable: false,
              },
            ],
            subRows: [
              {
                ...updatedProducts[index],
                name: product.name,
                id: product.id,
                price:
                  clientSpecialProducts?.filter(
                    (item) => item.product_id === product.id
                  )?.[0]?.price || product.price,
              },
            ],
          };

          return updatedProducts;
        }
      } else {
        // If index is not provided, create a new entry in the selected products
        return [
          ...prevSelectedProducts,
          {
            id: product.id,
            name: product.name,
            // Add other necessary fields as required
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

        // Update the main row type
        updatedProducts[index] = {
          ...updatedProducts[index],
          type: type.name,
          isServicesAll: false,
        };

        // If subRows exist, update them as well
        if (
          updatedProducts[index].subRows &&
          updatedProducts[index].subRows!.length > 0
        ) {
          updatedProducts[index].subRows = updatedProducts[index].subRows!.map(
            (subRow) => ({
              ...subRow,
              type: type.name,
            })
          );
        }

        return updatedProducts;
      } else {
        return prevSelectedProducts;
      }
    });

    setSelectedType(type.name);
  };

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
    teeth: number[],
    pontic_teeth: number[],
    index: number
  ) => {
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index >= 0 && index < prevSelectedProducts.length) {
        let updatedProducts = [...prevSelectedProducts];

        // Combine teeth and pontic_teeth without duplicates
        const uniqueTeeth = Array.from(new Set([...teeth, ...pontic_teeth]));

        // Generate subRows including both teeth and pontic_teeth
        const subRows = uniqueTeeth.map((tooth) => ({
          ...updatedProducts[index],
          teeth: [tooth], // Assigning a single tooth
          pontic_teeth: pontic_teeth.includes(tooth) ? [tooth] : [],
        }));

        updatedProducts[index] = {
          ...updatedProducts[index],
          teeth,
          pontic_teeth,
          subRows, // Updated subRows with unique teeth and pontic_teeth
        };

        return updatedProducts;
      } else {
        return prevSelectedProducts;
      }
    });

    groupSelectedTeeth(teeth);
  };

  const handleSaveShades = (index: number, subIndex?: number) => {
    // Construct the updated shades object
    const updatedShades = {
      occlusal_shade: shadeData[index]?.occlusal_shade || null,
      body_shade: shadeData[index]?.body_shade || null,
      gingival_shade: shadeData[index]?.gingival_shade || null,
      stump_shade: shadeData[index]?.stump_shade || null,
      custom_body: shadeData[index]?.custom_body || "",
      custom_gingival: shadeData[index]?.custom_gingival || "",
      custom_occlusal: shadeData[index]?.custom_occlusal || "",
      custom_stump: shadeData[index]?.custom_stump || "",
      manual_body: shadeData[index]?.manual_body || "",
      manual_gingival: shadeData[index]?.manual_gingival || "",
      manual_occlusal: shadeData[index]?.manual_occlusal || "",
      manual_stump: shadeData[index]?.manual_stump || "",
      // Generate subRows based on the length of the teeth array
      subRow: selectedProducts[index].teeth.map((item) => ({
        occlusal_shade: shadeData[index]?.occlusal_shade || null,
        body_shade: shadeData[index]?.body_shade || null,
        gingival_shade: shadeData[index]?.gingival_shade || null,
        stump_shade: shadeData[index]?.stump_shade || null,
        custom_body: shadeData[index]?.custom_body || "",
        custom_gingival: shadeData[index]?.custom_gingival || "",
        custom_occlusal: shadeData[index]?.custom_occlusal || "",
        custom_stump: shadeData[index]?.custom_stump || "",
        manual_body: shadeData[index]?.manual_body || "",
        manual_gingival: shadeData[index]?.manual_gingival || "",
        manual_occlusal: shadeData[index]?.manual_occlusal || "",
        manual_stump: shadeData[index]?.manual_stump || "",
      })),
    };

    // Update the products, including updating subRows based on the teeth count
    setselectedProducts((prevSelectedProducts: SavedProduct[]) => {
      if (index >= 0 && index < prevSelectedProducts.length) {
        const updatedProducts = [...prevSelectedProducts];
        console.log(subIndex, "subIndex");
        updatedProducts[index] = {
          ...updatedProducts[index],
          shades: updatedShades, // Update the main product shades
          subRows:
            subIndex !== undefined
              ? updatedProducts?.[index]?.subRows?.map((subRow, subIndex) => ({
                  ...subRow,
                  shades: {
                    occlusal_shade:
                      shadeData[index]?.subRow?.[subIndex ?? 0]
                        ?.occlusal_shade || null,
                    body_shade:
                      shadeData[index]?.subRow?.[subIndex ?? 0]?.body_shade ||
                      null,
                    gingival_shade:
                      shadeData[index]?.subRow?.[subIndex ?? 0]
                        ?.gingival_shade || null,
                    stump_shade:
                      shadeData[index]?.subRow?.[subIndex ?? 0]?.stump_shade ||
                      null,
                    custom_body:
                      shadeData[index]?.subRow?.[subIndex ?? 0]?.custom_body ||
                      "",
                    custom_gingival:
                      shadeData[index]?.subRow?.[subIndex ?? 0]
                        ?.custom_gingival || "",
                    custom_occlusal:
                      shadeData[index]?.subRow?.[subIndex ?? 0]
                        ?.custom_occlusal || "",
                    custom_stump:
                      shadeData[index]?.subRow?.[subIndex ?? 0]?.custom_stump ||
                      "",
                    manual_body:
                      shadeData[index]?.subRow?.[subIndex ?? 0]?.manual_body ||
                      "",
                    manual_gingival:
                      shadeData[index]?.subRow?.[subIndex ?? 0]
                        ?.manual_gingival || "",
                    manual_occlusal:
                      shadeData[index]?.subRow?.[subIndex ?? 0]
                        ?.manual_occlusal || "",
                    manual_stump:
                      shadeData[index]?.subRow?.[subIndex ?? 0]?.manual_stump ||
                      "",
                  }, // Apply the same updated shades to each subRow
                }))
              : updatedProducts?.[index]?.subRows?.map((subRow, subIndex) => ({
                  ...subRow,
                  shades: updatedShades, // Apply the same updated shades to each subRow
                })),
        };
        console.log(updatedProducts, "updatedProducts");
        return updatedProducts;
      } else {
        return prevSelectedProducts;
      }
    });

    // Close the shade popover for the current index
    setShadePopoverOpen((prev) => {
      const updated = new Map(prev);
      // Set all values in the Map to false
      updated.forEach((_, key) => {
        updated.set(key, false);
      });

      return updated;
    });
  };

  const handleDiscountChange = (index: number) => {
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
        additional_service_id: "",
        shades: {
          body_shade: null,
          gingival_shade: null,
          stump_shade: null,
          occlusal_shade: null,
        },
        discount: 0,
        notes: "",
        quantity: 1,
        is_taxable: false,
      };

      const newService: ServiceType = {
        id: "",
        name: "",
        price: 0,
        is_taxable: false,
        subRows: [],
      };

      setselectedProducts((prevSelectedProducts: SavedProduct[]) => [
        ...prevSelectedProducts,
        newProduct,
      ]);

      setselectedServices((prevSelectedServices: ServiceType[]) => [
        ...prevSelectedServices,
        newService,
      ]);
    }
  };
  const toggleNotePopover = (index: number) => {
    setNotePopoverOpen((prev) =>
      new Map(prev).set(index, !(prev.get(index) || false))
    );
  };
  const toggleServicesPopover = (index: number) => {
    setServicesPopoverOpen((prev) =>
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
    if (isUpdate) {
      console.log(selectedProducts, "selectedProductsselectedProducts updated");
      if (selectedProducts.length > 0) {
        const shades: ShadeData[] = selectedProducts.map((item) => {
          const baseShades: ShadeData = {
            id: item.id,
            body_shade: item.shades?.body_shade
              ? item.shades.body_shade
              : item.shades?.manual_body &&
                !item.shades.custom_body &&
                !item.shades?.body_shade
              ? "manual"
              : null,
            gingival_shade: item.shades?.gingival_shade
              ? item.shades.gingival_shade
              : item.shades?.manual_gingival &&
                !item.shades.custom_gingival &&
                !item.shades?.gingival_shade
              ? "manual"
              : null,
            occlusal_shade: item.shades?.occlusal_shade
              ? item.shades.occlusal_shade
              : item.shades?.manual_occlusal &&
                !item.shades.custom_occlusal &&
                !item.shades?.occlusal_shade
              ? "manual"
              : null,
            stump_shade: item.shades?.stump_shade
              ? item.shades.stump_shade
              : item.shades?.manual_stump &&
                !item.shades.custom_stump &&
                !item.shades?.stump_shade
              ? "manual"
              : null,
            custom_body: item.shades?.custom_body || "",
            custom_gingival: item.shades?.custom_gingival || "",
            custom_occlusal: item.shades?.custom_occlusal || "",
            custom_stump: item.shades?.custom_stump || "",
            manual_body: item.shades?.manual_body || "",
            manual_gingival: item.shades?.manual_gingival || "",
            manual_occlusal: item.shades?.manual_occlusal || "",
            manual_stump: item.shades?.manual_stump || "",
          };

          return {
            ...baseShades,
            subRow:
              item?.subRows?.map((item) => ({
                body_shade: item.shades?.body_shade
                  ? item.shades.body_shade
                  : item.shades?.manual_body &&
                    !item.shades.custom_body &&
                    !item.shades?.body_shade
                  ? "manual"
                  : null,
                gingival_shade: item.shades?.gingival_shade
                  ? item.shades.gingival_shade
                  : item.shades?.manual_gingival &&
                    !item.shades.custom_gingival &&
                    !item.shades?.gingival_shade
                  ? "manual"
                  : null,
                occlusal_shade: item.shades?.occlusal_shade
                  ? item.shades.occlusal_shade
                  : item.shades?.manual_occlusal &&
                    !item.shades.custom_occlusal &&
                    !item.shades?.occlusal_shade
                  ? "manual"
                  : null,
                stump_shade: item.shades?.stump_shade
                  ? item.shades.stump_shade
                  : item.shades?.manual_stump &&
                    !item.shades.custom_stump &&
                    !item.shades?.stump_shade
                  ? "manual"
                  : null,
                custom_body: item.shades?.custom_body || "",
                custom_gingival: item.shades?.custom_gingival || "",
                custom_occlusal: item.shades?.custom_occlusal || "",
                custom_stump: item.shades?.custom_stump || "",
                manual_body: item.shades?.manual_body || "",
                manual_gingival: item.shades?.manual_gingival || "",
                manual_occlusal: item.shades?.manual_occlusal || "",
                manual_stump: item.shades?.manual_stump || "",
              })) || [],
          };
        });
        setIsUpdate && setIsUpdate(false);
        setShadeData(shades);
      } else {
        setIsUpdate && setIsUpdate(false);
        setselectedProducts([
          {
            id: "",
            name: "",
            type: "",
            teeth: [],
            price: 0,
            additional_service_id: "",
            shades: {
              body_shade: null,
              gingival_shade: null,
              stump_shade: null,
              occlusal_shade: null,
            },
            discount: 0,
            notes: "",
            quantity: 1,
          },
        ]);
      }
    }
  }, [isUpdate]);
  console.log(shadeData, "Shades data");
  const sortedShadesItems = shadesItems.sort((a, b) => {
    // Compare the names in ascending order
    if (a.name === "Custom") return 1; // "Custom" should go to the bottom
    if (b.name === "Custom") return -1; // "Custom" should go to the bottom
    return a.name.localeCompare(b.name); // Default sorting by name (A-Z)
  });
  console.log(selectedProducts, "selectedProducts");
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
                <TableHead className="w-[10px]"></TableHead>
                <TableHead className="w-[100px] text-xs">Type</TableHead>
                <TableHead className="w-[120px] text-xs">Teeth</TableHead>
                <TableHead className="text-xs">Material/Product</TableHead>
                <TableHead className="w-[130px] text-xs">
                  Additional Services
                </TableHead>
                <TableHead className="text-xs">Shades</TableHead>
                <TableHead className="text-xs">Note</TableHead>
                <TableHead className="w-[20px] text-xs">Discount</TableHead>
                {/* <TableHead className="text-xs">QTY</TableHead> */}
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {selectedProducts?.map((row, index) => (
                <React.Fragment key={row.id}>
                  <TableRow key={row.id} className="border ">
                    <TableCell className="border-b w-[20px] cursor-pointer top-0 ">
                      {expandedRows.includes(row.id + index) ? (
                        <Minus
                          onClick={() => toggleRowExpansion(row.id + index)}
                          className="h-6 w-6"
                        />
                      ) : (
                        <Plus
                          onClick={() => toggleRowExpansion(row.id + index)}
                          className="h-6 w-6"
                        />
                      )}
                    </TableCell>
                    <TableCell className="border-b mr-2">
                      <Popover
                        open={openTypePopover === row.id + index}
                        onOpenChange={(open) => {
                          setOpenTypePopover(open ? row.id + index : null);
                          setExpandedRows([row.id + index]);
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
                          <div className="grid gap-0.5">
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
                                  if (type.id !== "add") {
                                    handleProductTypeChange(type, index);
                                    setOpenTypePopover(null);
                                  }
                                }}
                              >
                                {type.id === "add" ? (
                                  <>
                                    <div
                                      className={`grid grid-cols-2 text-sm gap-2 w-full`}
                                    >
                                      <button
                                        onClick={() => {
                                          handleOpenDialog("product_types");
                                          setOpenTypePopover(null);
                                        }}
                                        className="bg-green-100 py-1 text-center text-xs text-green-700 hover:bg-green-200 w-full rounded-sm flex gap-1 px-2"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add Type
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleOpenEditDialog("product_types");
                                          setOpenTypePopover(null);
                                        }}
                                        className="bg-blue-100 py-1 text-center text-xs text-blue-700 hover:bg-blue-200 w-full rounded-sm flex gap-1 px-2"
                                      >
                                        <Pencil className="w-4 h-4" />
                                        Edit Type
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  type.name
                                )}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>

                    <TableCell className="border-b">
                      <Popover
                        open={openTeethPopover === row.id + index}
                        onOpenChange={(open) => {
                          setOpenTeethPopover(open ? row.id + index : null);
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
                            disabled={!row.type || row.type === "Service"}
                          >
                            {row.type === "Bridge"
                              ? row.teeth.length > 0
                                ? formatTeethRange(row.teeth)
                                : "Select Teeth"
                              : row.teeth?.length > 0
                              ? row.teeth?.join(",")
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
                            disabled={!row.type || row.type === "Service"}
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
                    <TableCell
                      colSpan={1}
                      className="py-1.5 pl-4 pr-0 border-b"
                    >
                      <MultiColumnProductSelector
                        materials={materials}
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
                        clientSpecialProducts={clientSpecialProducts}
                      />
                    </TableCell>
                    {/* Main Row - Additional Services */}
                    <TableCell className="py-1.5 pl-4 pr-0 border-b">
                      <Popover open={servicesPopoverOpen.get(index) || false}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-full justify-start text-left text-xs"
                            disabled={!row.id && row.type !== "Service"}
                            onClick={() => toggleServicesPopover(index)}
                          >
                            {row?.commonServices &&
                            row?.commonServices?.length > 0 ? (
                              <span className="text-blue-600">
                                {row?.commonServices?.length} Common Services
                                Added
                              </span>
                            ) : (
                              "Add Services"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[25rem] p-3"
                          onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            setServicesPopoverOpen((prev) => {
                              const updated = new Map(prev);
                              updated.set(index, false);
                              return updated;
                            });
                          }}
                          onInteractOutside={(e) => {
                            e.preventDefault();
                            setServicesPopoverOpen((prev) => {
                              const updated = new Map(prev);
                              updated.set(index, false);
                              return updated;
                            });
                          }}
                          align="end"
                        >
                          <div className="w-full">
                            <div className="w-full">
                              <div className="flex justify-between mb-4">
                                <div>
                                  <h2>Add Additional Services </h2>
                                </div>
                                <div className="flex gap-2">
                                  <div className="text-blue-600">
                                    <p className="text-xs">
                                      <span className="font-bold">
                                        (
                                        {
                                          row?.commonServices?.filter(
                                            (item) => !item?.add_to_all
                                          ).length
                                        }
                                        )
                                      </span>
                                      common Services
                                    </p>
                                    <p className="text-xs">
                                      <span className="font-bold">
                                        (
                                        {
                                          row?.commonServices?.filter(
                                            (item) => item?.add_to_all
                                          ).length
                                        }
                                        )
                                      </span>{" "}
                                      Indivitual Services
                                    </p>
                                  </div>
                                  <Button
                                    size={"sm"}
                                    onClick={() =>
                                      setServicesPopoverOpen((prev) => {
                                        const updated = new Map(prev);
                                        updated.set(index, false);
                                        return updated;
                                      })
                                    }
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2 w-full">
                                {row?.commonServices?.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-1 justify-between"
                                  >
                                    <div className="flex gap-2">
                                      <input
                                        type="checkbox"
                                        checked={item.add_to_all}
                                        className="cursor-pointer"
                                        onChange={() => {
                                          setselectedProducts(
                                            (products: SavedProduct[]) => {
                                              const updatedProducts = [
                                                ...products,
                                              ];
                                              const currentProduct =
                                                updatedProducts[index];

                                              // Toggle `add_to_all` for this service
                                              item.add_to_all =
                                                !item.add_to_all;

                                              if (item.add_to_all) {
                                                // Move service to `row.services` & `row.subRows.services`
                                                currentProduct.services = [
                                                  ...(currentProduct.services ||
                                                    []),
                                                  item,
                                                ].filter(
                                                  (v, i, a) =>
                                                    a.findIndex(
                                                      (t) => t.id === v.id
                                                    ) === i
                                                ); // Ensure no duplicates

                                                // Sync subRows services
                                                currentProduct.subRows =
                                                  currentProduct.subRows?.map(
                                                    (subRow) => ({
                                                      ...subRow,
                                                      services: [
                                                        ...(currentProduct?.services ||
                                                          []),
                                                      ],
                                                    })
                                                  ) || [];

                                                // Remove from mainServices
                                                currentProduct.mainServices =
                                                  currentProduct.mainServices?.filter(
                                                    (service) =>
                                                      service.id !== item.id
                                                  ) || [];
                                              } else {
                                                // Move service to `row.mainServices` & remove from `services` & `subRows.services`
                                                currentProduct.mainServices = [
                                                  ...(currentProduct.mainServices ||
                                                    []),
                                                  item,
                                                ].filter(
                                                  (v, i, a) =>
                                                    a.findIndex(
                                                      (t) => t.id === v.id
                                                    ) === i
                                                ); // Ensure no duplicates

                                                // Remove from services
                                                currentProduct.services =
                                                  currentProduct.services?.filter(
                                                    (service) =>
                                                      service.id !== item.id
                                                  ) || [];

                                                // Remove from subRows services
                                                currentProduct.subRows =
                                                  currentProduct.subRows?.map(
                                                    (subRow) => ({
                                                      ...subRow,
                                                      services:
                                                        subRow.services?.filter(
                                                          (service) =>
                                                            service.id !==
                                                            item.id
                                                        ),
                                                    })
                                                  ) || [];
                                              }

                                              return updatedProducts;
                                            }
                                          );
                                        }}
                                      />
                                      <span className="text-xs flex justify-center items-center">
                                        Add to All
                                      </span>
                                    </div>
                                    <div className="flex justify-center items-center">
                                      <div className="flex justify-between w-full border rounded-sm p-1 text-xs">
                                        <p>{item.name}</p>
                                        <p>{item.price}</p>
                                      </div>
                                      <X
                                        onClick={() =>
                                          handleRemoveServices(
                                            item.id as string,
                                            true
                                          )
                                        }
                                        className="w-4 h-4 text-red-500 cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2">
                              <MultiColumnServiceSelector
                                materials={MATERIALS}
                                services={services}
                                selectedService={{
                                  id: selectedServices?.[index]?.id ?? "",
                                  name:
                                    selectedServices?.[index]?.name?.length > 0
                                      ? selectedServices?.[index]?.name
                                      : "Select a service",
                                  price: selectedServices?.[index]?.price ?? 0,
                                  is_taxable:
                                    selectedServices?.[index]?.is_taxable,
                                }}
                                onServiceSelect={(service) => {
                                  handleServiceSelect(service, index);
                                }}
                                disabled={loading || row.teeth.length === 0}
                                size="xs"
                                onClick={() => fetchServices()}
                                clientSpecialServices={clientSpecialServices}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>

                    <TableCell className="py-1.5 pl-4 pr-0 border-b">
                      <div className="flex flex-col space-y-0.5">
                        <Popover open={shadePopoverOpen.get(index) || false}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 text-xs ${
                                row.shades?.body_shade ||
                                row.shades?.gingival_shade ||
                                row.shades?.occlusal_shade ||
                                row.shades?.stump_shade
                                  ? "text-blue-600"
                                  : ""
                              }`}
                              disabled={
                                row.teeth.length === 0 && row.type !== "Service"
                              }
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
                                          item.id ===
                                          shadeData[index]?.body_shade
                                      )[0]?.name || (
                                        <span
                                          className="text-red-600"
                                          title="custom"
                                        >
                                          {shadeData[index]?.custom_body ||
                                            "--"}
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
                                          {shadeData[index]?.custom_stump ||
                                            "--"}
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
                                    value={
                                      shadeData[index]?.occlusal_shade || ""
                                    }
                                    onValueChange={(value) => {
                                      setShadeData((prev) => {
                                        const updatedShadeData = [...prev];
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          occlusal_shade: value,
                                          manual_occlusal: "",
                                          id: row.id,
                                          custom_occlusal: "",
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData?.[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      occlusal_shade: value,
                                                      manual_occlusal: "",
                                                      id: row.id,
                                                      custom_occlusal: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  occlusal_shade: value,
                                                  manual_occlusal: "",
                                                  id: row.id,
                                                  custom_occlusal: "",
                                                })),
                                        };
                                        return updatedShadeData;
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="N/A" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-[260px]">
                                        {sortedShadesItems.map((shade) => (
                                          <SelectItem
                                            key={shade.id}
                                            value={shade.id}
                                          >
                                            {shade.name}
                                          </SelectItem>
                                        ))}
                                      </ScrollArea>
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

                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_occlusal:
                                                          e.target.value,
                                                        occlusal_shade: e.target
                                                          .value
                                                          ? "manual"
                                                          : "",
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_occlusal:
                                                      e.target.value,
                                                    occlusal_shade: e.target
                                                      .value
                                                      ? "manual"
                                                      : "",
                                                  })),
                                          };
                                        } else {
                                          updatedShadeData[index] = {
                                            ...updatedShadeData[index],
                                            manual_occlusal: "",
                                            id: row.id,
                                            occlusal_shade: null,
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_occlusal: "",
                                                        occlusal_shade: null,
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_occlusal: "",
                                                    occlusal_shade: null,
                                                  })),
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
                                          occlusal_shade: null,

                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      custom_occlusal:
                                                        e.target.value.toUpperCase(),
                                                      id: row.id,
                                                      manual_occlusal: "",
                                                      occlusal_shade: null,
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  custom_occlusal:
                                                    e.target.value.toUpperCase(),
                                                  id: row.id,
                                                  manual_occlusal: "",
                                                  occlusal_shade: null,
                                                })),
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
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      body_shade: value,
                                                      id: row.id,
                                                      manual_body: "",
                                                      custom_body: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  body_shade: value,
                                                  id: row.id,
                                                  manual_body: "",
                                                  custom_body: "",
                                                })),
                                        };
                                        return updatedShadeData;
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="N/A" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-[260px]">
                                        {sortedShadesItems.map((shade) => (
                                          <SelectItem
                                            key={shade.id}
                                            value={shade.id}
                                          >
                                            {shade.name}
                                          </SelectItem>
                                        ))}
                                      </ScrollArea>
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
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_body:
                                                          e.target.value,
                                                        body_shade: "manual",
                                                        custom_body: "",
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_body: e.target.value,
                                                    body_shade: "manual",
                                                    custom_body: "",
                                                  })),
                                          };
                                        } else {
                                          updatedShadeData[index] = {
                                            ...updatedShadeData[index],
                                            manual_body: "",
                                            id: row.id,
                                            body_shade: null,
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? selectedProducts[0].teeth.map(
                                                    (item) => ({
                                                      manual_body: "",
                                                      body_shade: null,
                                                    })
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_body: "",
                                                    id: row.id,
                                                    body_shade: null,
                                                  })),
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
                                          body_shade: null,
                                          manual_body: "",
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      custom_body:
                                                        e.target.value.toUpperCase(),
                                                      id: row.id,
                                                      body_shade: null,
                                                      manual_body: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  custom_body:
                                                    e.target.value.toUpperCase(),
                                                  id: row.id,
                                                  body_shade: null,
                                                  manual_body: "",
                                                })),
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
                                    value={
                                      shadeData[index]?.gingival_shade || ""
                                    }
                                    onValueChange={(value) => {
                                      setShadeData((prev) => {
                                        const updatedShadeData = [...prev];
                                        updatedShadeData[index] = {
                                          ...updatedShadeData[index],
                                          gingival_shade: value,
                                          manual_gingival: "",
                                          id: row.id,
                                          custom_gingival: "",
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      gingival_shade: value,
                                                      manual_gingival: "",
                                                      id: row.id,
                                                      custom_gingival: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  gingival_shade: value,
                                                  manual_gingival: "",
                                                  id: row.id,
                                                  custom_gingival: "",
                                                })),
                                        };
                                        return updatedShadeData;
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="N/A" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-[260px]">
                                        {sortedShadesItems.map((shade) => (
                                          <SelectItem
                                            key={shade.id}
                                            value={shade.id}
                                          >
                                            {shade.name}
                                          </SelectItem>
                                        ))}
                                      </ScrollArea>
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
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_gingival:
                                                          e.target.value,
                                                        id: row.id,
                                                        gingival_shade:
                                                          "manual",
                                                        custom_gingival: "",
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_gingival:
                                                      e.target.value,
                                                    id: row.id,
                                                    gingival_shade: "manual",
                                                    custom_gingival: "",
                                                  })),
                                          };
                                        } else {
                                          updatedShadeData[index] = {
                                            ...updatedShadeData[index],
                                            manual_gingival: "",
                                            id: row.id,
                                            gingival_shade: null,
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_gingival: "",
                                                        id: row.id,
                                                        gingival_shade: null,
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_gingival: "",
                                                    id: row.id,
                                                    gingival_shade: null,
                                                  })),
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
                                          gingival_shade: null,
                                          manual_gingival: "",
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      custom_gingival:
                                                        e.target.value.toUpperCase(),
                                                      id: row.id,
                                                      gingival_shade: null,
                                                      manual_gingival: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  custom_gingival:
                                                    e.target.value.toUpperCase(),
                                                  id: row.id,
                                                  gingival_shade: null,
                                                  manual_gingival: "",
                                                })),
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
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      stump_shade: value,
                                                      manual_stump: "",
                                                      custom_stump: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  stump_shade: value,
                                                  manual_stump: "",
                                                  custom_stump: "",
                                                })),
                                        };
                                        return updatedShadeData;
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="N/A" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <ScrollArea className="h-[200px]">
                                        {sortedShadesItems.map((shade) => (
                                          <SelectItem
                                            key={shade.id}
                                            value={shade.id}
                                          >
                                            {shade.name}
                                          </SelectItem>
                                        ))}
                                      </ScrollArea>
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
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_stump:
                                                          e.target.value,
                                                        id: row.id,
                                                        stump_shade: "manual",
                                                        custom_stump: "",
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_stump:
                                                      e.target.value,
                                                    id: row.id,
                                                    stump_shade: "manual",
                                                    custom_stump: "",
                                                  })),
                                          };
                                        } else {
                                          updatedShadeData[index] = {
                                            ...updatedShadeData[index],
                                            manual_stump: "",
                                            id: row.id,
                                            stump_shade: null,
                                            subRow:
                                              updatedShadeData?.[index]?.subRow
                                                ?.length ?? 0 > 0
                                                ? updatedShadeData[
                                                    index
                                                  ]?.subRow?.map(
                                                    (subRowItem, subIndex) => {
                                                      return {
                                                        ...subRowItem,
                                                        manual_stump: "",
                                                        id: row.id,
                                                        stump_shade: null,
                                                      };
                                                    }
                                                  )
                                                : selectedProducts[
                                                    index
                                                  ].teeth.map((item) => ({
                                                    manual_stump: "",
                                                    id: row.id,
                                                    stump_shade: null,
                                                  })),
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
                                          stump_shade: null,
                                          manual_stump: "",
                                          subRow:
                                            updatedShadeData?.[index]?.subRow
                                              ?.length ?? 0 > 0
                                              ? updatedShadeData[
                                                  index
                                                ]?.subRow?.map(
                                                  (subRowItem, subIndex) => {
                                                    return {
                                                      ...subRowItem,
                                                      custom_stump:
                                                        e.target.value.toUpperCase(),
                                                      id: row.id,
                                                      stump_shade: null,
                                                      manual_stump: "",
                                                    };
                                                  }
                                                )
                                              : selectedProducts[
                                                  index
                                                ].teeth.map((item) => ({
                                                  custom_stump:
                                                    e.target.value.toUpperCase(),
                                                  id: row.id,
                                                  stump_shade: null,
                                                  manual_stump: "",
                                                })),
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
                    <TableCell className="border-b">
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
                            disabled={!row.id && row.type !== "Service"}
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
                                        notes: newNote, // Update the main row's note
                                        subRows: updatedProducts?.[
                                          index
                                        ]?.subRows?.map((subRow) => ({
                                          ...subRow,
                                          notes: newNote, // Update the note for each subRow
                                        })),
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
                            disabled={!row.id && row.type !== "Service"}
                            onClick={() => togglePercentPopover(index)}
                          >
                            {selectedProducts?.[index]?.discount}{" "}
                            <Percent className="h-4 w-4" />
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

                            <div>
                              <h2 className="text-sm font-bold">
                                Product Prices
                              </h2>
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
                                    value={row?.discount}
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

                                          // Update the discount for the main row
                                          updatedProducts[index] = {
                                            ...updatedProducts[index],
                                            discount: updatedDiscount,

                                            // Also update the discount for all subRows
                                            subRows:
                                              updatedProducts[
                                                index
                                              ]?.subRows?.map((subRow) => ({
                                                ...subRow,
                                                discount: updatedDiscount, // Apply the same discount to each subRow
                                              })) ?? [], // Default to an empty array if subRows is undefined or null
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
                              <h2 className="text-sm font-bold mt-5">
                                Service Prices
                              </h2>
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
                                    value={row?.services?.[0]?.discount}
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

                                          // Update the discount for the main row
                                          updatedProducts[index] = {
                                            ...updatedProducts[index],
                                            services: updatedProducts[
                                              index
                                            ]?.services?.map((item) => ({
                                              ...item,
                                              discount: updatedDiscount,
                                            })), // Also update the discount for all subRows
                                            subRows:
                                              updatedProducts[
                                                index
                                              ]?.subRows?.map((subRow) => ({
                                                ...subRow, // Keep the properties of subRow intact
                                                services: subRow?.services?.map(
                                                  (item) => ({
                                                    ...item,
                                                    discount: updatedDiscount,
                                                  })
                                                ),
                                              })) ?? [], // Default to an empty array if subRows is undefined or null
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
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    {/* <TableCell className="border-b">
                      <Input
                        type="number"
                        value={selectedProducts[index].quantity || 1}
                        onChange={(e) => {
                          const updatedQuantity = Number(e.target.value);

                          setselectedProducts(
                            (prevSelectedProducts: SavedProduct[]) => {
                              const updatedProducts = [...prevSelectedProducts];

                              updatedProducts[index] = {
                                ...updatedProducts[index],
                                quantity: updatedQuantity,
                                subRows:
                                  updatedProducts[index]?.subRows?.map(
                                    (subRow) => ({
                                      ...subRow,
                                      quantity: updatedQuantity,
                                    })
                                  ) ?? [],
                              };

                              return updatedProducts;
                            }
                          );
                        }}
                        placeholder="Quantity"
                        className="w-20"
                      />
                    </TableCell> */}

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
                  {expandedRows.includes(row.id + index) &&
                    row?.subRows &&
                    row?.subRows?.length >= 1 &&
                    row?.subRows?.map((row_sub, subIndex) => {
                      let originalIndex = subIndex;
                      subIndex = subIndex + 100;

                      return (
                        <TableRow key={subIndex} className="border pl-10">
                          <TableCell className="border-b"></TableCell>
                          <TableCell className="border-b">
                            <Popover
                              open={false}
                              onOpenChange={(open) => {
                                setOpenTypePopover(open ? row_sub.id : null);
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className={cn(
                                    "w-full h-9 px-3 py-2 text-sm justify-start font-normal border rounded-md",
                                    !row_sub.type && "text-muted-foreground"
                                  )}
                                >
                                  {row_sub.type || "Select Type"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <div className="grid gap-1">
                                  {productTypes.map((type) => (
                                    <Button
                                      key={type.id}
                                      variant={
                                        row_sub.type === type.name
                                          ? "secondary"
                                          : "ghost"
                                      }
                                      className={cn(
                                        "justify-start text-left h-auto py-2 px-3 w-full text-sm",
                                        row_sub.type === type.name
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
                              open={false}
                              onOpenChange={(open) => {
                                setOpenTeethPopover(open ? row_sub.id : null);
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className={cn(
                                    "w-full h-9 px-3 py-2 text-sm justify-start font-normal border rounded-md",
                                    row_sub.teeth.length === 0 &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  {row_sub.teeth[0]}{" "}
                                  {ponticTeeth.has(row_sub.teeth[0]) ? (
                                    <span className="ml-2 text-primary text-xs">
                                      (Pontic)
                                    </span>
                                  ) : (
                                    ""
                                  )}
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
                              ></PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="py-1.5 pl-4 pr-0 border-b">
                            <MultiColumnProductSelector
                              materials={materials}
                              products={products}
                              selectedProduct={{
                                id: row_sub.id ?? "",
                                name:
                                  row_sub.name.length > 0
                                    ? row_sub.name
                                    : "Select a Product",
                              }}
                              onProductSelect={(product) => {
                                handleProductSubSelect(
                                  product,
                                  index,
                                  originalIndex
                                );
                              }}
                              size="xs"
                              onClick={() => fetchedProducts(row_sub.type)}
                              clientSpecialProducts={clientSpecialProducts}
                            />
                          </TableCell>
                          <TableCell className="py-1.5 pl-4 pr-0 border-b">
                            <Popover
                              open={
                                servicesPopoverOpen.get(
                                  subIndex + index + 100 + originalIndex
                                ) || false
                              }
                            >
                              <PopoverTrigger asChild>
                                {/* <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-6 w-6",
                                    row.notes ? "text-blue-600" : "",
                                    "hover:text-blue-600 ml-5"
                                  )}
                                  disabled={!row.id && row.type !== "Service"}
                                  onClick={() =>
                                    toggleServicesPopover(
                                      subIndex + index + 100 + originalIndex
                                    )
                                  }
                                >
                                  <Button
                                    className="text-xs py-0 h-[30px] ml-5"
                                    variant={"outline"}
                                  >
                                    <span className="text-xs">
                                      {" "}
                                      {row_sub?.services?.length === 0 ||
                                      !row.services ? (
                                        "Add Services"
                                      ) : (
                                        <span className="text-blue-600">
                                          {row_sub?.services?.length} Added
                                        </span>
                                      )}
                                    </span>
                                  </Button>
                                </Button> */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-full justify-start text-left text-xs"
                                  disabled={!row.id && row.type !== "Service"}
                                  onClick={() => toggleServicesPopover(subIndex + index + 100 + originalIndex)}
                                >
                                  {row?.commonServices?.length === 0 ? (
                                    "Add Services"
                                  ) : (
                                    <span className="text-xs">
                                      {" "}
                                      {row_sub?.services?.length === 0 ||
                                      !row.services ? (
                                        "Add Services"
                                      ) : (
                                        <span className="text-blue-600">
                                          {row_sub?.services?.length} Added
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-80 p-3"
                                onEscapeKeyDown={(e) => {
                                  e.preventDefault();
                                  setServicesPopoverOpen((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(
                                      subIndex + index + 100 + originalIndex,
                                      false
                                    );
                                    return updated;
                                  });
                                }}
                                onInteractOutside={(e) => {
                                  e.preventDefault();
                                  setServicesPopoverOpen((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(
                                      subIndex + index + 100 + originalIndex,
                                      false
                                    );
                                    return updated;
                                  });
                                }}
                                align="end"
                              >
                                <div className="space-y-2 w-full">
                                  <div className="flex justify-between w-full">
                                    <Label className="text-xs">
                                      Add Services sub
                                    </Label>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        setServicesPopoverOpen((prev) => {
                                          const updated = new Map(prev);
                                          updated.set(
                                            subIndex +
                                              index +
                                              100 +
                                              originalIndex,
                                            false
                                          );
                                          return updated;
                                        })
                                      }
                                    >
                                      Save
                                    </Button>
                                  </div>
                                  <MultiColumnServiceSelector
                                    materials={MATERIALS}
                                    services={services}
                                    selectedService={{
                                      id: selectedServices?.[index]?.id ?? "",
                                      name:
                                        selectedServices?.[index]?.name
                                          ?.length > 0
                                          ? selectedServices?.[index]?.name
                                          : "Select a service",
                                      price:
                                        selectedServices?.[index]?.price ?? 0,
                                      is_taxable:
                                        selectedServices?.[index]?.is_taxable,
                                    }}
                                    onServiceSelect={(service) => {
                                      handleSubServiceSelect(
                                        service,
                                        index,
                                        originalIndex
                                      );
                                    }}
                                    disabled={loading || row.teeth.length === 0}
                                    size="xs"
                                    onClick={() => fetchServices()}
                                    clientSpecialServices={
                                      clientSpecialServices
                                    }
                                  />

                                  <div className="w-full">
                                    <div className="grid grid-cols-1 gap-2 w-full">
                                      {row_sub?.services?.map((item) => {
                                        return (
                                          <div className="flex items-center justify-center">
                                            <div className="flex justify-between w-full border rounded-sm p-1 text-xs">
                                              <p>{item.name}</p>
                                              <p>{item.price}</p>
                                            </div>
                                            <X
                                              onClick={() =>
                                                handleRemoveServices(
                                                  item.id as string,
                                                  false,
                                                  originalIndex
                                                )
                                              }
                                              className="w-4 h-4 text-red-500 cursor-pointer"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>

                          <TableCell className="py-1.5 pl-4 pr-0 border-b">
                            <div className="flex flex-col space-y-0.5">
                              <Popover
                                open={
                                  shadePopoverOpen.get(
                                    subIndex + index + 100 + originalIndex
                                  ) || false
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-7 text-sm ${
                                      row_sub.shades?.body_shade ||
                                      row_sub.shades?.gingival_shade ||
                                      row_sub.shades?.occlusal_shade ||
                                      row_sub.shades?.stump_shade
                                        ? "text-blue-600"
                                        : ""
                                    }`}
                                    disabled={row_sub.teeth.length === 0}
                                    onClick={() =>
                                      toggleShadePopover(
                                        subIndex + index + 100 + originalIndex
                                      )
                                    }
                                  >
                                    {row_sub.shades?.body_shade ||
                                    row_sub.shades?.gingival_shade ||
                                    row_sub.shades?.occlusal_shade ||
                                    row_sub.shades?.custom_body ||
                                    row_sub.shades?.custom_gingival ||
                                    row_sub.shades?.custom_occlusal ||
                                    row_sub.shades?.manual_occlusal ||
                                    row_sub.shades?.manual_gingival ||
                                    row_sub.shades?.manual_body ||
                                    row_sub.shades?.manual_stump ||
                                    row_sub.shades?.custom_stump ||
                                    (row?.subRows &&
                                      row?.subRows?.length > 0) ||
                                    row_sub.shades?.stump_shade ? (
                                      <div>
                                        {row_sub.shades?.occlusal_shade ===
                                          "manual" ||
                                        row_sub.shades?.occlusal_shade === null
                                          ? row_sub.shades?.manual_occlusal
                                          : shadesItems.filter(
                                              (item) =>
                                                item.id ===
                                                row_sub.shades?.occlusal_shade
                                            )[0]?.name || (
                                              <span
                                                className="text-red-600"
                                                title="custom"
                                              >
                                                {row_sub.shades
                                                  ?.custom_occlusal || "--"}
                                              </span>
                                            )}
                                        /
                                        {row_sub.shades?.body_shade === null ||
                                        row_sub.shades?.body_shade === "manual"
                                          ? row_sub.shades?.manual_body
                                          : shadesItems.filter(
                                              (item) =>
                                                item.id ===
                                                row_sub.shades?.body_shade
                                            )[0]?.name || (
                                              <span
                                                className="text-red-600"
                                                title="custom"
                                              >
                                                {row_sub.shades?.custom_body ||
                                                  "--"}
                                              </span>
                                            )}
                                        /
                                        {row_sub.shades?.gingival_shade ===
                                          "manual" ||
                                        row_sub.shades?.gingival_shade === null
                                          ? row_sub.shades?.manual_gingival
                                          : shadesItems.filter(
                                              (item) =>
                                                item.id ===
                                                row_sub.shades?.gingival_shade
                                            )[0]?.name || (
                                              <span
                                                className="text-red-600"
                                                title="custom"
                                              >
                                                {row_sub.shades
                                                  ?.custom_gingival || "--"}
                                              </span>
                                            )}
                                        /
                                        {row_sub.shades?.stump_shade ===
                                          "manual" ||
                                        row_sub.shades?.stump_shade === null
                                          ? row_sub.shades?.manual_stump
                                          : shadesItems.filter(
                                              (item) =>
                                                item.id ===
                                                row_sub.shades?.stump_shade
                                            )[0]?.name || (
                                              <span
                                                className="text-red-600"
                                                title="custom"
                                              >
                                                {row_sub.shades?.custom_stump ||
                                                  "--"}
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
                                      updated.set(
                                        subIndex + index + 100 + originalIndex,
                                        false
                                      );
                                      return updated;
                                    });
                                  }}
                                  onInteractOutside={(e) => {
                                    e.preventDefault();
                                    setShadePopoverOpen((prev) => {
                                      const updated = new Map(prev);
                                      updated.set(
                                        subIndex + index + 100 + originalIndex,
                                        false
                                      );
                                      return updated;
                                    });
                                  }}
                                >
                                  <div className="grid gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-medium leading-none">
                                        Shades {originalIndex}
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
                                        <Label htmlFor="occlusal">
                                          Incisal
                                        </Label>
                                        <Select
                                          value={
                                            row_sub.shades?.manual_occlusal ? "manual" :  row_sub.shades?.occlusal_shade || ""
                                          }
                                          onValueChange={(value) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Clone the subRow before modifying to avoid mutation
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          occlusal_shade: value,
                                                          manual_occlusal: "",
                                                          custom_occlusal: "",
                                                        },
                                                      };
                                                    } else {
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
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
                                          value={
                                            row_sub.shades?.manual_occlusal ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          manual_occlusal:
                                                            e.target.value,
                                                          occlusal_shade: e
                                                            .target.value
                                                            ? "manual"
                                                            : "",
                                                          custom_occlusal: e
                                                            .target.value
                                                            ? ""
                                                            : "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />

                                        <Input
                                          type="text"
                                          value={
                                            row_sub.shades?.custom_occlusal ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          custom_occlusal:
                                                            e.target.value.toUpperCase(),
                                                          occlusal_shade: null, // Clear occlusal_shade if needed
                                                          manual_occlusal: "", // Clear manual_occlusal
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />
                                      </div>

                                      {/* Body Shade */}
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="body">Body</Label>
                                        <Select
                                          value={
                                            row_sub.shades?.manual_body ? "manual" :  row_sub.shades?.body_shade || ""
                                          }
                                          onValueChange={(value) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          body_shade: value,
                                                          manual_body: "",
                                                          custom_body: "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
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
                                          value={
                                            row_sub.shades?.manual_body || ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          manual_body:
                                                            e.target.value,
                                                          id: row_sub.id,
                                                          body_shade: e.target
                                                            .value
                                                            ? "manual"
                                                            : "",
                                                          custom_body: "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />

                                        <Input
                                          type="text"
                                          value={
                                            row_sub.shades?.custom_body || ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          custom_body:
                                                            e.target.value.toUpperCase(),
                                                          id: row_sub.id,
                                                          body_shade: null, // Reset body_shade
                                                          manual_body: "", // Clear manual_body
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />
                                      </div>

                                      {/* Gingival Shade */}
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="gingival">
                                          Gingival
                                        </Label>
                                        <Select
                                          value={
                                            row_sub.shades?.manual_gingival ? "manual" :  row_sub.shades?.gingival_shade || ""
                                          }
                                          onValueChange={(value) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          gingival_shade: value,
                                                          manual_gingival: "",
                                                          custom_gingival: "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
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
                                          value={
                                            row_sub.shades?.manual_gingival ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          manual_gingival:
                                                            e.target.value,
                                                          gingival_shade: e
                                                            .target.value
                                                            ? "manual"
                                                            : "",
                                                          custom_gingival: "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />

                                        <Input
                                          type="text"
                                          value={
                                            row_sub.shades?.custom_gingival ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          custom_gingival:
                                                            e.target.value.toUpperCase(),
                                                          gingival_shade: null,
                                                          manual_gingival: "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />
                                      </div>

                                      {/* Stump Shade */}
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="stump">Stump</Label>
                                        <Select
                                          value={
                                            row_sub.shades?.manual_stump ? "manual" : row_sub.shades?.stump_shade || ""
                                          }
                                          onValueChange={(value) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    // Clone existing subRows or initialize an empty array
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      // Update existing subRow
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          stump_shade: value,
                                                          manual_stump: "",
                                                          custom_stump: "",
                                                        },
                                                      };
                                                    } else {
                                                      // Add a new subRow if it doesn't exist
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
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
                                          value={
                                            row_sub.shades?.manual_stump || ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          manual_stump:
                                                            e.target.value,
                                                          stump_shade: e.target
                                                            .value
                                                            ? "manual"
                                                            : null,
                                                          custom_stump: "",
                                                          id: row_sub.id,
                                                        },
                                                      };
                                                    } else {
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />

                                        <Input
                                          type="text"
                                          value={
                                            row_sub.shades?.custom_stump || ""
                                          }
                                          onChange={(e) => {
                                            setselectedProducts(
                                              (prev: SavedProduct[]) =>
                                                prev.map((product, idx) => {
                                                  if (idx === index) {
                                                    const updatedSubRows =
                                                      product.subRows
                                                        ? [...product.subRows]
                                                        : [];

                                                    if (
                                                      updatedSubRows[
                                                        originalIndex
                                                      ]
                                                    ) {
                                                      updatedSubRows[
                                                        originalIndex
                                                      ] = {
                                                        ...updatedSubRows[
                                                          originalIndex
                                                        ],
                                                        shades: {
                                                          ...updatedSubRows[
                                                            originalIndex
                                                          ].shades,
                                                          custom_stump:
                                                            e.target.value.toUpperCase(),
                                                          stump_shade: null,
                                                          manual_stump: "",
                                                          id: row_sub.id,
                                                        },
                                                      };
                                                    } else {
                                                      [];
                                                    }

                                                    return {
                                                      ...product,
                                                      subRows: updatedSubRows,
                                                    };
                                                  }
                                                  return product;
                                                })
                                            );
                                          }}
                                          className="w-20 h-7 text-sm bg-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleCancelShades(
                                            subIndex +
                                              index +
                                              100 +
                                              originalIndex
                                          )
                                        }
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          // handleSaveShades(index, originalIndex)
                                          setShadePopoverOpen((prev) => {
                                            const updated = new Map(prev);
                                            // Set all values in the Map to false
                                            updated.forEach((_, key) => {
                                              updated.set(
                                                subIndex +
                                                  index +
                                                  100 +
                                                  originalIndex,
                                                false
                                              );
                                            });

                                            return updated;
                                          })
                                        }
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
                            <Popover
                              open={
                                notePopoverOpen.get(
                                  subIndex + index + 100 + originalIndex
                                ) || false
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-6 w-6",
                                    row_sub.notes ? "text-blue-600" : "",
                                    "hover:text-blue-600"
                                  )}
                                  disabled={!row_sub.id}
                                  onClick={() =>
                                    toggleNotePopover(
                                      subIndex + index + 100 + originalIndex
                                    )
                                  }
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
                                    updated.set(
                                      subIndex + index + 100 + originalIndex,
                                      false
                                    );
                                    return updated;
                                  });
                                }}
                                onInteractOutside={(e) => {
                                  e.preventDefault();
                                  setNotePopoverOpen((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(
                                      subIndex + index + 100 + originalIndex,
                                      false
                                    );
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
                                          updated.set(
                                            subIndex +
                                              index +
                                              100 +
                                              originalIndex,
                                            false
                                          );
                                          return updated;
                                        })
                                      }
                                    >
                                      Save
                                    </Button>
                                  </div>
                                  <Textarea
                                    placeholder="Enter note for this subRow..."
                                    value={
                                      selectedProducts[index]?.subRows?.[
                                        originalIndex
                                      ]?.notes ?? ""
                                    }
                                    onChange={(e) => {
                                      const newNote = e.target.value;

                                      setselectedProducts(
                                        (
                                          prevSelectedProducts: SavedProduct[]
                                        ) => {
                                          const updatedProducts = [
                                            ...prevSelectedProducts,
                                          ];

                                          if (
                                            index >= 0 &&
                                            index < updatedProducts.length
                                          ) {
                                            updatedProducts[index] = {
                                              ...updatedProducts[index],
                                              subRows:
                                                updatedProducts[
                                                  index
                                                ]?.subRows?.map(
                                                  (subRow, subIndex) => {
                                                    if (
                                                      subIndex === originalIndex
                                                    ) {
                                                      // Only update the specific subRow at originalIndex
                                                      return {
                                                        ...subRow,
                                                        notes: newNote,
                                                      };
                                                    }
                                                    return subRow; // Keep other subRows unchanged
                                                  }
                                                ) ?? [], // In case subRows is undefined or null, default to an empty array
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
                            <Popover
                              open={
                                percentPopoverOpen.get(
                                  subIndex + index + 100 + originalIndex
                                ) || false
                              }
                            >
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
                                  disabled={!row_sub.id}
                                  onClick={() =>
                                    togglePercentPopover(
                                      subIndex + index + 100 + originalIndex
                                    )
                                  }
                                >
                                  {row_sub.discount}
                                  <Percent className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-80 p-3"
                                onEscapeKeyDown={(e) => {
                                  e.preventDefault();
                                  setPercentPopoverOpen((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(
                                      subIndex + index + 100 + originalIndex,
                                      false
                                    );
                                    return updated;
                                  });
                                }}
                                onInteractOutside={(e) => {
                                  e.preventDefault();
                                  setPercentPopoverOpen((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(
                                      subIndex + index + 100 + originalIndex,
                                      false
                                    );
                                    return updated;
                                  });
                                }}
                                align="end"
                              >
                                <div className="flex flex-col justify-between">
                                  <div className="flex justify-between">
                                    <Label className="text-xs">
                                      Add Discount
                                    </Label>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        handleDiscountChange(
                                          subIndex + index + 100 + originalIndex
                                        );
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </div>

                                  <div>
                                    <h2 className="text-sm font-bold">
                                      Product Prices sub
                                    </h2>
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

                                                // Update the discount for the main row
                                                updatedProducts[index] = {
                                                  ...updatedProducts[index],
                                                  discount: updatedDiscount,

                                                  // Also update the discount for all subRows
                                                  subRows:
                                                    updatedProducts[
                                                      index
                                                    ]?.subRows?.map(
                                                      (subRow) => ({
                                                        ...subRow,
                                                        discount:
                                                          updatedDiscount, // Apply the same discount to each subRow
                                                      })
                                                    ) ?? [], // Default to an empty array if subRows is undefined or null
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
                                          {(
                                            row.price *
                                            (1 - discount / 100)
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                    <h2 className="text-sm font-bold mt-5">
                                      Service Prices
                                    </h2>
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
                                          value={
                                            row_sub?.services?.[0]?.discount ||
                                            0
                                          }
                                          onChange={(e) => {
                                            const updatedDiscount = Number(
                                              e.target.value
                                            );

                                            setselectedProducts(
                                              (
                                                prevSelectedProducts: SavedProduct[]
                                              ) => {
                                                return prevSelectedProducts.map(
                                                  (product, i) => {
                                                    if (i === index) {
                                                      return {
                                                        ...product,
                                                        subRows:
                                                          product.subRows?.map(
                                                            (
                                                              subRow,
                                                              subIndex
                                                            ) =>
                                                              subIndex ===
                                                              originalIndex
                                                                ? {
                                                                    ...subRow,
                                                                    services:
                                                                      subRow.services?.map(
                                                                        (
                                                                          service
                                                                        ) => ({
                                                                          ...service,
                                                                          discount:
                                                                            updatedDiscount,
                                                                        })
                                                                      ),
                                                                  }
                                                                : subRow
                                                          ),
                                                      };
                                                    }
                                                    return product;
                                                  }
                                                );
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
                                          {(
                                            row.price *
                                            (1 - discount / 100)
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          {/* <TableCell className="border-b relative">
                            <Input
                              type="number"
                              value={row_sub.quantity}
                              onChange={(e) => {
                                const updatedQuantity = Number(e.target.value);

                                setselectedProducts(
                                  (prevSelectedProducts: SavedProduct[]) => {
                                    const updatedProducts = [
                                      ...prevSelectedProducts,
                                    ];

                                    // Update the quantity for the subRow at the given index
                                    updatedProducts[index] = {
                                      ...updatedProducts[index],
                                      subRows:
                                        updatedProducts[index]?.subRows?.map(
                                          (subRowItem, i) => {
                                            if (i === originalIndex) {
                                              return {
                                                ...subRowItem,
                                                quantity: updatedQuantity, // Update quantity for the specific subRow
                                              };
                                            }
                                            return subRowItem; // Keep other subRows unchanged
                                          }
                                        ) ?? [], // Ensure it's an empty array if subRows is undefined or null
                                    };

                                    return updatedProducts;
                                  }
                                );
                              }}
                              placeholder="Quantity"
                              className="w-20"
                            />
                          </TableCell> */}
                          <TableCell className="border-b">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setselectedProducts(
                                  (prevProducts: SavedProduct[]) => {
                                    return prevProducts.map((product, idx) => {
                                      if (idx === index) {
                                        const updatedSubRows =
                                          product.subRows?.filter(
                                            (_, i) => i !== originalIndex
                                          ) || [];

                                        const removedTeeth =
                                          product.subRows?.[originalIndex]
                                            ?.teeth?.[0];

                                        const updatedTeeth =
                                          product.teeth?.filter(
                                            (tooth) => tooth !== removedTeeth
                                          ) || [];

                                        return {
                                          ...product,
                                          subRows: updatedSubRows,
                                          teeth: updatedTeeth,
                                        };
                                      }
                                      return product;
                                    });
                                  }
                                );
                                setShadeData((prevShadeData: ShadeData[]) => {
                                  return prevShadeData.map((shade, idx) => {
                                    if (idx === index) {
                                      return {
                                        ...shade,
                                        subRow:
                                          shade.subRow?.filter(
                                            (_, i) => i !== originalIndex
                                          ) || [],
                                      };
                                    }
                                    return shade;
                                  });
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </React.Fragment>
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
                          id={`occlusion-design-${option.value}`}
                        />
                        <Label htmlFor={`occlusion-design-${option.value}`}>
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
                  {initialCaseDetails?.occlusalDesign ===
                    OcclusalDesign.Custom && (
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
                  {initialCaseDetails?.alloyType === PonticType.Custom && (
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

      <AddProductValuesDialog
        open={openDialog === "product_types"}
        onOpenChange={(open: boolean) => !open && setOpenDialog(null)}
        type="product_types"
        labId={lab?.labId as string}
        reCall={() => fetchProductTypes()}
      />
      <EditProductValuesDialog
        open={openEditDialog === "product_types"}
        onOpenChange={(open: boolean) => !open && setOpenEditDialog(null)}
        title="Product Types"
        type="product_types"
        labId={lab?.labId as string}
        reCall={() => fetchProductTypes()}
      />
    </div>
  );
};

export default ProductConfiguration;
