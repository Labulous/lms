import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ProductWizard from '../../components/settings/ProductWizard';
import ServiceModal from '../../components/settings/ServiceModal';
import { Product, PRODUCT_TYPES, ProductType } from '../../data/mockProductData';
import { mockServices, Service } from '../../data/mockServiceData';
import CategoryList from '../../components/settings/CategoryList';
import ProductList from '../../components/settings/ProductList';
import { productsService } from '../../services/productsService';
import { toast } from 'react-hot-toast';

const ProductsServices: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await productsService.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    try {
      await productsService.addProduct(newProduct);
      await loadProducts();
      setIsWizardOpen(false);
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleAddService = (newService: Service) => {
    setServices([...services, newService]);
    setIsServiceModalOpen(false);
  };

  const filteredProducts = selectedType === 'all' 
    ? products 
    : products.filter(product => product.type === selectedType);

  const filteredServices = selectedType === 'all'
    ? services
    : services.filter(service => service.types.includes(selectedType));

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
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
            onClick={() => setIsWizardOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Product Wizard
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Categories Column */}
        <div className="w-1/4">
          <CategoryList
            categories={PRODUCT_TYPES}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        </div>

        {/* Products and Services Column */}
        <div className="w-3/4 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
            <ProductList products={filteredProducts} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Services</h2>
            <ProductList products={filteredServices.map(service => ({
              id: service.id,
              name: service.name,
              price: service.price,
              isClientVisible: service.isClientVisible,
              isTaxable: service.isTaxable,
              type: service.types[0], // Using first type for display
              billingType: 'generic',
            }))} />
          </div>
        </div>
      </div>

      {isWizardOpen && (
        <ProductWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSave={handleAddProduct}
        />
      )}

      {isServiceModalOpen && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          onSave={handleAddService}
        />
      )}
    </div>
  );
};

export default ProductsServices;