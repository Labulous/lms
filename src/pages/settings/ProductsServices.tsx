import React, { useState, useEffect, useMemo } from "react";
import { Plus, Settings2 } from "lucide-react";
import ProductWizard from "../../components/settings/ProductWizard";
import ServiceModal from "../../components/settings/ServiceModal";
import DeleteConfirmationModal from "../../components/settings/DeleteConfirmationModal";
import { mockServices, Service } from "../../data/mockServiceData";
import ProductList from "../../components/settings/ProductList";
import { productsService } from "../../services/productsService";
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
import { Checkbox } from "@radix-ui/react-checkbox";
import { Badge } from "@/components/ui/badge";
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

const ProductsServices: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [productsToDelete, setProductsToDelete] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [searhTerm, setSearchTerm] = useState("");
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
  const { user } = useAuth();

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
    if (activeTab === "services" && servicesApi) {
      setServices(servicesApi);
    }
    if (materialsApi) {
      console.log("hi");
      setMaterials(materialsApi);
    }
  }, [activeTab]);

  const loadProductsAndTypes = async () => {
    try {
      setLoading(true);
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData) {
        toast.error("Unable to get Lab Id");
        return null;
      }
      const [productsResult, typesResult] = await Promise.all([
        productsService.getProducts(labData.labId),
        supabase.from("product_types").select("*").order("name"),
      ]);
      if (typesResult.error) throw typesResult.error;

      setProducts(productsResult);
      setProductTypes(typesResult.data as any[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        "Failed to load products and types. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
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

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsWizardOpen(true);
  };

  const handleDeleteClick = async (product: Product) => {
    try {
      // Check if we're trying to delete a service (services have no material_id)
      if (!product.material_id && activeTab === "services") {
        setServices((prev) =>
          prev.filter((service) => service.id !== product.id)
        );
        toast.success("Service deleted successfully");
        return;
      }

      // For products, show confirmation dialog
      setProductsToDelete([product]);
      setIsDeleteModalOpen(true);
    } catch (error) {
      console.error("Error in handleDeleteClick:", error);
      toast.error("An error occurred while processing your request");
    }
  };

  const handleBatchDeleteClick = async (products: Product[]) => {
    // Show confirmation dialog for batch delete
    setProductsToDelete(products);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productsToDelete.length === 0) return;

    try {
      // Delete all products in the array
      for (const product of productsToDelete) {
        await productsService.deleteProduct(product.id);
      }

      // Update local state immediately
      setProducts((prev) =>
        prev.filter((p) => !productsToDelete.map((d) => d.id).includes(p.id))
      );

      const message =
        productsToDelete.length === 1
          ? "Product deleted successfully"
          : `${productsToDelete.length} products deleted successfully`;
      toast.success(message);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(
        error.message || "Failed to delete product. Please try again."
      );
    } finally {
      setIsDeleteModalOpen(false);
      setProductsToDelete([]);
    }
  };
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
        .eq("lab_id", labIdData?.lab_id);

      setServices(services as any[]);
    } catch (err) {
      console.log("faild to fetch Services", err);
    }
  };
  console.log(services, "service");
  console.log(formData, "Form");
  const handleAddService = async (newService: Service) => {
    const {
      name,
      description,
      categories,
      is_client_visible,
      price,
      is_taxable,
      material_id,
    } = newService;
    // Log the new service object
    console.log(newService, "handleAddService");

    try {
      setServiceInsertLoading(true);
      // Insert the new service into the 'services' table on Supabase
      const { data, error } = await supabase
        .from("services")
        .insert([
          {
            name,
            description,
            categories,
            is_client_visible,
            is_taxable,
            price,
            lab_id: labIdData?.lab_id,
            material_id,
          },
        ])
        .select("*");
      setServiceInsertLoading(false);
      setServiceInsertLoading(false);
      setFormData({
        name: "",
        description: "",
        price_error: "",
        category_error: "",
        price: 0,
        is_client_visible: false,
        is_taxable: false,
        categories: [],
      });
      // Check if there was an error
      if (error) {
        throw new Error(error.message);
      }
      setIsServiceModalOpen(false);
      fetchServices();
    } catch (err) {
      setServiceInsertLoading(false);
      toast.error("Error inserting service:");
    }
  };

  const handleBatchAdd = async (products: any[]) => {
    try {
      // Create products one by one to ensure proper error handling
      for (const product of products) {
        console.log("Adding product:", product); // Debug log
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
        .map((p) => p.material?.name)
        .filter((name): name is string => name !== undefined && name !== null)
    );
    return Array.from(uniqueMaterials).map((name) => ({ id: name, name }));
  }, [products]);

  console.log(materialsData, "materialsData");
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
            onBatchDelete={handleBatchDeleteClick}
            onBatchAdd={handleBatchAdd}
            activeTab={activeTab}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-4 w-full">
          <div className="">
            <div className="flex justify-end items-end pb-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search Services..."
                  value={searhTerm}
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
                        <span className="text-sm font-medium ">
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
                            key={material.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`material-${material.id}`}
                              checked={materialFilter.includes(material.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setMaterialFilter((prev) => [
                                    ...prev,
                                    material.name,
                                  ]);
                                } else {
                                  setMaterialFilter((prev) =>
                                    prev.filter((t) => t !== material.name)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`material-${material.id}`}
                              className="flex items-center text-sm font-medium cursor-pointer"
                            >
                              <Badge
                                variant={material.name as any}
                                className="ml-1"
                              >
                                {material.name}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {/* {onBatchAdd && (
                <BatchProductUpload
                  onUpload={async (products) => {
                    await onBatchAdd(products);
                  }}
                />
              )} */}
                <Button onClick={() => setIsServiceModalOpen(true)}>
                  <span className="flex gap-1 items-center">
                    <Plus className="w-4 h-4" />
                    Add Services
                  </span>
                </Button>
              </div>
            </div>
            <Table className="w-full">
              <TableHeader className="">
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>price</TableHead>
                  <TableHead>Is Client Visible</TableHead>
                  <TableHead>is_taxable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service, i) => (
                  <TableRow key={i}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>{service?.material?.name}</TableCell>
                    <TableCell>${service.price}</TableCell>
                    <TableCell>
                      {service.is_client_visible ? "Yes" : "False"}
                    </TableCell>
                    <TableCell>
                      {service.is_taxable ? "Yes" : "False"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleAddService}
        isLoading={serviceInsertLoading}
        formData={formData}
        setFormData={setFormData}
        materials={materialsData}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductsToDelete([]);
        }}
        onConfirm={handleDeleteConfirm}
        title={
          productsToDelete.length === 1 ? "Delete Product" : "Delete Products"
        }
        message={
          productsToDelete.length === 1
            ? "Are you sure you want to delete this product? This action cannot be undone."
            : `Are you sure you want to delete ${productsToDelete.length} products? This action cannot be undone.`
        }
      />
    </div>
  );
};

export default ProductsServices;
