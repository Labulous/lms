import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import ProductWizard from "../../components/settings/ProductWizard";
import ServiceModal from "../../components/settings/ServiceModal";
import DeleteConfirmationModal from "../../components/settings/DeleteConfirmationModal";
import { mockServices, Service } from "../../data/mockServiceData";
import ProductList from "../../components/settings/ProductList";
import { productsService } from "../../services/productsService";
import { supabase } from "../../lib/supabase";
import { Database } from "../../types/supabase";
import { toast } from "react-hot-toast";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [services, setServices] = useState<Service[]>(mockServices);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [productsToDelete, setProductsToDelete] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    loadProductsAndTypes();
  }, []);

  const { user } = useAuth();

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
        setServices(prev => prev.filter(service => service.id !== product.id));
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
      setProducts(prev => prev.filter(p => !productsToDelete.map(d => d.id).includes(p.id)));
      
      const message = productsToDelete.length === 1 
        ? "Product deleted successfully" 
        : `${productsToDelete.length} products deleted successfully`;
      toast.success(message);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setProductsToDelete([]);
    }
  };

  const handleAddService = (newService: Service) => {
    setServices([...services, newService]);
    setIsServiceModalOpen(false);
  };

  const handleBatchAdd = async (products: any[]) => {
    try {
      // Create products one by one to ensure proper error handling
      for (const product of products) {
        console.log('Adding product:', product); // Debug log
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

  return (
    <div className="container mx-auto px-4 py-4">
      <PageHeader
        heading="Products & Services"
        description="Manage your product catalog and service offerings."
      />

      <Tabs defaultValue="products" className="space-y-4 mt-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductList
            products={products}
            productTypes={productTypes}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
            onBatchDelete={handleBatchDeleteClick}
            onBatchAdd={handleBatchAdd}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <ProductList
            products={services.map((service) => ({
              id: service.id,
              name: service.name,
              description: "",
              lead_time: 0,
              price: service.price,
              is_client_visible: service.isClientVisible,
              is_taxable: service.isTaxable,
              material: null,
              product_type: null,
              billing_type: null,
              material_id: "",
              product_type_id: "",
              billing_type_id: "",
              category: "",
              requires_shade: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              discount: service.discount as number,
            }))}
            productTypes={productTypes}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
            onBatchDelete={handleBatchDeleteClick}
            onBatchAdd={handleBatchAdd}
          />
        </TabsContent>
      </Tabs>

      <ProductWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedProduct(undefined);
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleAddService}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductsToDelete([]);
        }}
        onConfirm={handleDeleteConfirm}
        title={productsToDelete.length === 1 ? "Delete Product" : "Delete Products"}
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
