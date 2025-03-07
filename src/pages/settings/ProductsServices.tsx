import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Settings2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import ProductWizard from "../../components/settings/ProductWizard";
import ServiceModal from "../../components/settings/ServiceModal";
import DeleteConfirmationModal from "../../components/settings/DeleteConfirmationModal";
import { mockServices } from "../../data/mockServiceData";
import ProductList from "../../components/settings/ProductList";
import { productsService, ServiceInput } from "../../services/productsService";
import { supabase } from "../../lib/supabase";
import { Database, Materials } from "../../types/supabase";
import { toast } from "react-hot-toast";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox component
import { Badge } from "@/components/ui/badge";
import BatchServiceUpload from "@/components/settings/BatchServiceUpload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export interface ServicesFormData {
  categories: string[];
  price_error?: string;
  category_error?: string;
  name: string;
  price: number;
  is_client_visible: boolean;
  is_taxable: boolean;
  discount?: number;
  description?: string;
  material_id?: string;
}

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  material: { name: string } | null;
  product_type: { name: string } | null;
  billing_type: { name: string; label: string | null } | null;
};

type ProductType = Database["public"]["Tables"]["product_types"]["Row"];

type ServiceBase = {
  name: string;
  description: string;
  price: number;
  is_client_visible: boolean;
  is_taxable: boolean;
  material_id?: string;
  lab_id: string;
  product_code?: string;
  material?: { name: string } | null;
};

type Service = ServiceBase & {
  id: string;
  created_at: string;
  updated_at: string;
};

interface SortConfig {
  key: keyof Service;
  direction: "asc" | "desc";
}

const ProductsServices: React.FC = () => {
  const { user } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [itemsToDelete, setItemsToDelete] = useState<(Product | Service)[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceInsertLoading, setServiceInsertLoading] = useState(false);
  const [materialFilter, setMaterialFilter] = useState<string[]>([]);
  const [materialsData, setMaterials] = useState<Materials[]>([]);
  const [formData, setFormData] = useState<ServicesFormData>({
    name: "",
    description: "",
    price_error: "",
    category_error: "",
    price: 0,
    is_client_visible: false,
    is_taxable: false,
    categories: [],
    material_id: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });


  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    supabase.from("users").select("lab_id").eq("id", user?.id).single(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const { data: products1, error: caseError } = useQuery(
    labIdData?.lab_id
      ? supabase
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
        .eq("lab_id", labIdData?.lab_id)
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000,
    }
  );
  if (caseError && labIdData?.lab_id) {
    // toast.error("failed to fetech cases");
  }
  const { data: productTypes1, error: productTypesError } = useQuery(
    products1 && labIdData?.lab_id
      ? supabase
        .from("product_types")
        .select(
          `
*
      `
        )
        .order("name")
        .eq("lab_id", labIdData?.lab_id)
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000,
    }
  );
  if (productTypesError && labIdData?.lab_id) {
    // toast.error("failed to fetech cases");
  }
  const { data: servicesApi, error: servicesApiError } = useQuery(
    productTypes1 && labIdData?.lab_id
      ? supabase
        .from("services")
        .select(
          `
        *,
        material:materials(name)
      `
        )

        .eq("lab_id", labIdData?.lab_id)
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000,
    }
  );
  const { data: materialsApi, error: materialsError } = useQuery(
    productTypes1 && labIdData?.lab_id
      ? supabase
        .from("materials")
        .select(
          `
           *
          `
        )

        .eq("lab_id", labIdData?.lab_id)
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000,
    }
  );
  if (productTypesError && labIdData?.lab_id) {
    // toast.error("failed to fetech cases");
  }
  useEffect(() => {
    // loadProductsAndTypes();
    if (products1 && products1?.length > 0) {
      setProducts(products1 as any[]);
    }
    if (productTypes1 && productTypes1?.length > 0) {
      setProductTypes(productTypes1 as any[]);
    }
  }, [productTypes1]);

  useEffect(() => {
    if (servicesApi) {
      setServices(servicesApi);
    }
    if (materialsApi) {
      setMaterials(materialsApi);
    }
  }, [activeTab]);

  useEffect(() => {
    const urlParams = location.pathname + location.search; // Get full URL path + query

    if (urlParams.includes("products&")) {
      const productsAfterAmpersand = decodeURIComponent(
        urlParams.split("products&")[1]
      );
      setActiveTab("products");
      setMaterialFilter([productsAfterAmpersand]);
    } else if (urlParams.includes("services&")) {
      const servicesAfterAmpersand = decodeURIComponent(
        urlParams.split("services&")[1]
      );
      setActiveTab("services");
      setMaterialFilter([servicesAfterAmpersand]);
    }
  }, [location]); // Run when the location changes
  const loadProductsAndTypes = async () => {
    try {
      //
      const { data: productsResult, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          material:materials(name),
          product_type:product_types(name),
          billing_type:billing_types(name, label)
          `
        )
        .eq("lab_id", labIdData?.lab_id)
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
        .order("name");

      if (productsError) {
        toast.error("Failed to fetch products.");
        throw new Error("Failed to fetch products.");
      }

      //
      const { data: productTypesData, error: productTypesError } =
        await supabase.from("product_types").select("*").order("name");

      if (productTypesError) {
        toast.error("Failed to fetch product types.");
        throw new Error("Failed to fetch product types.");
      }

      //
      setProducts(productsResult || []);
      setProductTypes(productTypesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load products and types. Please refresh."
      );
    } finally {
      setLoading(false); //
    }
  };

  const handleSaveProduct = async () => {
    try {
      toast.success(
        selectedProduct
          ? "Product updated successfully"
          : "Product added successfully"
      );
      await loadProductsAndTypes();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(
        selectedProduct
          ? "Failed to update product. Please try again."
          : "Failed to add product. Please try again."
      );
    } finally {
      setIsWizardOpen(false);
      setSelectedProduct(undefined);
    }
  };

  const handleEditProduct = async (product: Product) => {

    console.log(product, "ProductList");

    const lab = await getLabIdByUserId(user?.id as string);
    if (!lab?.labId) {
      console.error("Lab ID not found.");
      return;
    }
    // Fetch existing product by ID
    const { data: existingProduct, error: existingProductError } = await supabase
      .from("products")
      .select("id, material_id, product_code")
      .eq("id", product.id)
      .single();

    if (existingProductError) {
      console.error("Error fetching existing product:", existingProductError);
      throw existingProductError;
    }

    let newProductCode = product.product_code; // Default to the current product code
    // Check if the material_id has changed
    if (existingProduct?.material_id !== product.material_id) {
      // Fetch the material code
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("code")
        .eq("id", product.material_id)
        .single();

      if (materialError || !materialData) {
        throw new Error("Failed to fetch material code");
      }

      // Fetch existing products for the lab with the new material_id
      const { data: existingProducts, error: fetchError } = await supabase
        .from("products")
        .select("id, product_code")
        .eq("lab_id", lab?.labId)
        .eq("material_id", product.material_id);

      if (fetchError) {
        console.error("Error fetching existing products:", fetchError);
        throw fetchError;
      }

      // Generate new product code
      const highestProductCode =
        existingProducts.length > 0
          ? Math.max(...existingProducts.map((p) => Number(p?.product_code) || 0))
          : Number(materialData.code);

      newProductCode = (highestProductCode + 1).toString();
    }


    const { data, error } = await supabase
      .from("products")
      .update({
        name: product.name,
        price: product.price,
        description: product.description,
        lead_time: product.lead_time,
        is_client_visible: product.is_client_visible,
        is_taxable: product.is_taxable,
        material_id: product.material_id,
        billing_type_id: product.billing_type_id,
        requires_shade: product.requires_shade,
        product_code: newProductCode,
      })
      .eq("id", product.id)
      .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
      .select();

    if (error) {
      toast.error("Error updating product:");
    } else if (data) {
      toast.success("Product updated successfully:");
      await loadProductsAndTypes();
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (itemsToDelete.length === 0) return;

      // Close modal first to prevent UI freeze
      setIsDeleteModalOpen(false);

      for (const item of itemsToDelete) {
        if ("lead_time" in item) {
          // It's a product
          const { error } = await supabase
            .from("products")
            .delete()
            .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
            .eq("id", item.id);

          if (error) throw error;
        } else {
          // It's a service
          const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", item.id);

          if (error) throw error;
        }
      }

      // Update local state based on what was deleted
      const deletedIds = itemsToDelete.map((item) => item.id);
      if ("lead_time" in itemsToDelete[0]) {
        // Products were deleted
        setProducts((prev) =>
          prev.filter((item) => !deletedIds.includes(item.id))
        );
        toast.success(
          `Successfully deleted ${itemsToDelete.length} product(s)`
        );
      } else {
        // Services were deleted
        setServices((prev) =>
          prev.filter((item) => !deletedIds.includes(item.id))
        );
        toast.success(
          `Successfully deleted ${itemsToDelete.length} service(s)`
        );
      }

      // Clear delete state
      setItemsToDelete([]);
      setSelectedServices([]);
    } catch (error) {
      console.error("Error in handleDeleteConfirm:", error);
      toast.error("An error occurred while processing your request");
      // Make sure modal is closed even on error
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteClick = async (
    item: Product | Service,
    tableName: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${item.name}"?`
    );
    if (!confirmed) return;

    try {
      // Check if the item exists in 'products'
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id")
        .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
        .eq("id", item.id)
        .single();

      if (productData) {
        tableName = "products";
      } else {
        // Check if the item exists in 'services' only if not found in 'products'
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("id")
          .eq("id", item.id)
          .single();

        if (serviceData) {
          tableName = "services";
        } else {
          toast.error("Item not found in any table.");
          return;
        }
      }

      // Perform the update on the correct table
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ is_archive: true })
        .eq("id", item.id);

      if (updateError) {
        console.error(`Error archiving ${tableName}:`, updateError);
        toast.error(`Failed to archive the item from ${tableName}.`);
      } else {
        toast.success("Item successfully archived.");
      }

      const urlParams = location.pathname + location.search; // Get full URL path + query

      //navigate("/material-selection", { replace: true });
      setLoading(true)
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 100);
      setLoading(false)
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An error occurred.");
    }
  };

  const handleEditClick = async (item: Product | Service) => {
    // setItemsToDelete([item]);
    // setIsDeleteModalOpen(true);
    toast.error("Feature under development hi");
  };

  // Batch delete function for services
  const handleBatchDelete = async (selectedItems: (Product | Service)[]) => {
    if (!selectedItems || selectedItems.length === 0) {
      toast.error("No items selected.");
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_archive: true,
          updated_at: new Date().toISOString(),
        })
        .in(
          "id",
          selectedItems.map((item) => item.id)
        );

      if (error) {
        console.error("Error archiving products:", error);
        toast.error("Failed to archive the items.");
      } else {
        toast.success("Items successfully archived.");
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 500);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An error occurred.");
    }
  };

  // Batch delete function for services
  const handleServiceBatchDelete = async (selectedItems: any[]) => {
    if (!selectedItems || selectedItems.length === 0) {
      toast.error("No items selected.");
      return;
    }

    const selectedIds = selectedItems.map((item) =>
      typeof item === "string" ? item : item.id
    );

    const confirmed = window.confirm(
      `Are you sure you want to archive ${selectedIds.length} item(s)?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("services")
        .update({
          is_archive: true,
          updated_at: new Date().toISOString(),
        })
        .in("id", selectedIds);

      if (error) {
        console.error("Error archiving services:", error);
        toast.error("Failed to archive the items.");
      } else {
        toast.success("Items successfully archived.");

        fetchServices();
        setLoading(true)
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 100);
        setLoading(false)
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An error occurred.");
    }
  };

  // const handleBatchDelete = async () => {
  //   if (selectedServices.length === 0) return;

  //   const servicesToDelete = services.filter((service) =>
  //     selectedServices.includes(service.id)
  //   );
  //   setItemsToDelete(servicesToDelete);
  //   setIsDeleteModalOpen(true);
  //   setSelectedServices([]); // Clear selection after setting items to delete
  // };

  const fetchServices = async () => {
    try {
      const { data: services, error: errorServices } = await supabase
        .from("services")
        .select(
          `
               *,
        material:materials(name)
              `
        )
        .eq("lab_id", labIdData?.lab_id)
        .or("is_archive.is.null,is_archive.eq.false"); // Includes null and false values

      setServices(services as any[]);
    } catch (err) {
      console.log("faild to fetch Services", err);
    }
  };

  const handleAddService = async (newServices: ServiceInput[]) => {
    try {
      if (!labIdData?.lab_id) {
        toast.error("Unable to get Lab ID");
        return;
      }

      const servicesToAdd = newServices.map((service) => ({
        ...service,
        lab_id: labIdData.lab_id,
      }));

      const { data, error } = await supabase
        .from("services")
        .insert(servicesToAdd)
        .select();

      if (error) {
        throw error;
      }

      toast.success("Service added successfully");
      fetchServices();
      setIsServiceModalOpen(false);
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error("Failed to add service");
    }
  };

  const handleBatchAdd = async (products: any[]) => {
    try {
      // Create products one by one to ensure proper error handling
      for (const product of products) {
        await productsService.addProduct(product);
      }

      toast.success(`Successfully added ${products.length} products`);
      await loadProductsAndTypes();
    } catch (error) {
      console.error("Error adding products:", error);
      toast.error(
        "Failed to add some products. Please check the data and try again."
      );
    }
  };

  const handleBatchServiceUpload = async (
    services: Omit<Service, "id" | "created_at" | "updated_at">[]
  ) => {
    try {
      if (!labIdData?.lab_id) {
        toast.error("Unable to get Lab ID");
        return;
      }

      const { data, error } = await supabase
        .from("services")
        .insert(
          services.map((service) => ({
            ...service,
            lab_id: labIdData.lab_id,
          }))
        )
        .select();

      if (error) throw error;

      toast.success(`Successfully added ${services.length} services`);
      fetchServices();
    } catch (error) {
      console.error("Error adding services:", error);
      toast.error("Failed to add services. Please try again.");
    }
  };

  // Sorting functions
  const handleSort = (key: keyof Service) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: keyof Service) => {
    if (sortConfig.key !== key)
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const sortServices = (services: Service[]) => {
    return [...services].sort((a, b) => {
      // Special handling for material name
      if (sortConfig.key === "material_id") {
        const aValue = a.material?.name ?? "";
        const bValue = b.material?.name ?? "";
        const comparison =
          aValue.toLowerCase() < bValue.toLowerCase()
            ? -1
            : aValue.toLowerCase() > bValue.toLowerCase()
              ? 1
              : 0;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle boolean values
      if (typeof aValue === "boolean") {
        return sortConfig.direction === "asc"
          ? aValue === bValue
            ? 0
            : aValue
              ? -1
              : 1
          : aValue === bValue
            ? 0
            : aValue
              ? 1
              : -1;
      }

      // Handle string/number values
      const comparison =
        String(aValue).toLowerCase() < String(bValue).toLowerCase()
          ? -1
          : String(aValue).toLowerCase() > String(bValue).toLowerCase()
            ? 1
            : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading products and services...</div>
      </div>
    );
  }

  const materials = useMemo(() => {
    const uniqueMaterials = new Set(
      products
        .map((product) => product.material?.name)
        .filter((name): name is string => name !== null && name !== undefined)
    );
    return Array.from(uniqueMaterials);
  }, [products]);

  // const filteredServices = useMemo(() => {
  //   return services.filter(service =>
  //     service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     (service.material?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }, [services, searchTerm]);

  const filteredServices = useMemo(() => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (service.material?.name ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (materialFilter.length > 0) {
      filtered = filtered.filter(
        (service) =>
          service.material?.name &&
          materialFilter.includes(service.material.name)
      );
    }

    return filtered;
  }, [services, searchTerm, materialFilter]);

  useEffect(() => {
    const urlParams = location.pathname + location.search;
    if (urlParams.includes("products&")) {
      const afterAmpersand = urlParams.split("products&")[1];
      setMaterialFilter([afterAmpersand.split("%20").join(" ")]);
    }
  }, [location, materialFilter]);

  return (
    <div className="container mx-auto px-4 py-4">
      <PageHeader
        heading="Products & Services"
        description="Manage your product catalog and service offerings."
      />
      <Tabs
        defaultValue="products"
        className="space-y-4 mt-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductList
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
            onBatchDelete={handleBatchDelete}
            onBatchAdd={handleBatchAdd}
            activeTab={activeTab}
            materialsData={materialsData}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-4 w-full">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {selectedServices.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleServiceBatchDelete(selectedServices)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedServices.length})
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search Services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[300px]"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Filter by Material</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-4" align="start">
                    <div className="flex flex-col gap-4 bg-white border p-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">
                          Filter by Material
                        </span>
                        {materialFilter.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMaterialFilter([])}
                            className="h-8 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 bg-white">
                        {materials.map((material: any) => (
                          <div
                            key={material}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`material-${material}`}
                              checked={materialFilter.includes(material)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setMaterialFilter((prev) => [
                                    ...prev,
                                    material,
                                  ]);
                                } else {
                                  setMaterialFilter((prev) =>
                                    prev.filter((t) => t !== material)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`material-${material}`}
                              className="flex items-center text-sm font-medium cursor-pointer"
                            >
                              <Badge variant={material} className="ml-1">
                                {material}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button onClick={() => setIsServiceModalOpen(true)}>
                  <span className="flex gap-1 items-center">
                    <Plus className="w-4 h-4" />
                    Add Services
                  </span>
                </Button>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          services.length > 0 &&
                          selectedServices.length === services.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices(services.map((s) => s.id));
                          } else {
                            setSelectedServices([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("product_code")}
                    >
                      <div className="flex items-center">
                        Code
                        {getSortIcon("product_code")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer w-[250px]"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon("name")}
                      </div>
                    </TableHead>


                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("material_id")}
                    >
                      <div className="flex items-center">
                        Material
                        {getSortIcon("material_id")}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer text-right"
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center justify-end">
                        Price
                        {getSortIcon("price")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("description")}
                    >
                      <div className="flex items-center">
                        Description
                        {getSortIcon("description")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("is_client_visible")}
                    >
                      <div className="flex items-center">
                        Client Visible
                        {getSortIcon("is_client_visible")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("is_taxable")}
                    >
                      <div className="flex items-center">
                        Taxable
                        {getSortIcon("is_taxable")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortServices(filteredServices).map((service) => (
                    <TableRow
                      key={service.id}
                      className="hover:bg-muted/50" // Add hover effect to table rows
                    >
                      <TableCell className="w-[50px]">
                        <Checkbox
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServices((prev) => [
                                ...prev,
                                service.id,
                              ]);
                            } else {
                              setSelectedServices((prev) =>
                                prev.filter((id) => id !== service.id)
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {service?.product_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {service?.name}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {service?.material?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${service.price}
                      </TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            service.is_client_visible ? "default" : "secondary"
                          }
                        >
                          {service.is_client_visible ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={service.is_taxable ? "default" : "secondary"}
                        >
                          {service.is_taxable ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(service)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleDeleteClick(service, "services")
                              }
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ProductWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedProduct(undefined);
        }}
        onSave={() => handleSaveProduct()}
        product={selectedProduct}
      />
      <BatchServiceUpload
        onUpload={handleBatchServiceUpload}
        setIsOpen={setIsServiceModalOpen}
        isOpen={isServiceModalOpen}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemsToDelete([]);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemsToDelete[0] && "lead_time" in itemsToDelete[0]
          ? "Product"
          : "Service"
          }`}
        message={
          itemsToDelete.length === 1
            ? "Are you sure you want to delete this item? This action cannot be undone."
            : `Are you sure you want to delete ${itemsToDelete.length} items? This action cannot be undone.`
        }
      />
    </div>
  );
};

export default ProductsServices;
