import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ProductWizard from '../../components/settings/ProductWizard';
import ServiceModal from '../../components/settings/ServiceModal';
import DeleteConfirmationModal from '../../components/settings/DeleteConfirmationModal';
import { mockServices, Service } from '../../data/mockServiceData';
import ProductList from '../../components/settings/ProductList';
import { productsService } from '../../services/productsService';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { toast } from 'react-hot-toast';

type Product = Database['public']['Tables']['products']['Row'] & {
  material: { name: string } | null;
  product_type: { name: string } | null;
  billing_type: { name: string; label: string | null } | null;
};

type ProductType = Database['public']['Tables']['product_types']['Row'];

const ProductsServices: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [productToDelete, setProductToDelete] = useState<Product | undefined>();

  useEffect(() => {
    loadProductsAndTypes();
  }, []);

  const loadProductsAndTypes = async () => {
    try {
      setLoading(true);
      const [productsResult, typesResult] = await Promise.all([
        productsService.getProducts(),
        supabase.from('product_types').select('*').order('name')
      ]);

      if (typesResult.error) throw typesResult.error;
      
      setProducts(productsResult);
      setProductTypes(typesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products and types. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (savedProduct: Product) => {
    try {
      toast.success(selectedProduct ? 'Product updated successfully' : 'Product added successfully');
      await loadProductsAndTypes();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(selectedProduct 
        ? 'Failed to update product. Please try again.' 
        : 'Failed to add product. Please try again.'
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

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productsService.deleteProduct(productToDelete.id);
      await loadProductsAndTypes();
      setIsDeleteModalOpen(false);
      setProductToDelete(undefined);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    }
  };

  const handleAddService = (newService: Service) => {
    setServices([...services, newService]);
    setIsServiceModalOpen(false);
  };

  const filteredProducts = selectedType === 'all' 
    ? products 
    : products.filter(product => product.product_type_id === selectedType);

  const filteredServices = selectedType === 'all'
    ? services
    : services.filter(service => service.types?.includes(selectedType));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading products and services...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Products & Services</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Service
          </button>
          <button
            onClick={() => {
              setSelectedProduct(undefined);
              setIsWizardOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Product
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Product Types Column */}
        <div className="w-1/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Product Types
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              <button
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedType === 'all' ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedType('all')}
              >
                All Products
              </button>
              {productTypes.map((type) => (
                <button
                  key={type.id}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedType === type.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products and Services Column */}
        <div className="w-3/4 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
            <ProductList 
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteClick}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Services</h2>
            <ProductList 
              products={filteredServices.map(service => ({
                id: service.id,
                name: service.name,
                price: service.price,
                is_client_visible: service.isClientVisible,
                is_taxable: service.isTaxable,
                material: null,
                product_type: null,
                billing_type: null,
                material_id: '',
                product_type_id: '',
                billing_type_id: '',
                category: '',
                requires_shade: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))} 
            />
          </div>
        </div>
      </div>

      {isWizardOpen && (
        <ProductWizard
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setSelectedProduct(undefined);
          }}
          onSave={handleSaveProduct}
          product={selectedProduct}
        />
      )}

      {isServiceModalOpen && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          onSave={handleAddService}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ProductsServices;