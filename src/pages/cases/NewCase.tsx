import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import OrderDetailsStep from '../../components/cases/wizard/steps/OrderDetailsStep';
import ProductConfiguration from '../../components/cases/wizard/ProductConfiguration';
import FilesStep from '../../components/cases/wizard/steps/FilesStep';
import NotesStep from '../../components/cases/wizard/steps/NotesStep';
import { SavedProduct, ProductWithShade } from '../../components/cases/wizard/types';
import { Case, CaseStatus, DeliveryMethod, addCase } from '../../data/mockCasesData';
import { Client, clientsService } from '../../services/clientsService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { ProductCategory } from '../../data/mockProductData';
import { productsService } from '../../services/productsService';

const defaultEnclosedItems = {
  impression: 0,
  biteRegistration: 0,
  photos: 0,
  jig: 0,
  opposingModel: 0,
  articulator: 0,
  returnArticulator: 0,
  cadcamFiles: 0,
  consultRequested: 0,
};

interface FormData {
  clientId: string;
  patientFirstName: string;
  patientLastName: string;
  orderDate: string;
  status: CaseStatus;
  deliveryMethod: DeliveryMethod;
  dueDate?: string;
  isDueDateTBD?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  enclosedItems: {
    impression: number;
    biteRegistration: number;
    photos: number;
    jig: number;
    opposingModel: number;
    articulator: number;
    returnArticulator: number;
    cadcamFiles: number;
    consultRequested: number;
  };
  otherItems?: string;
  clientName?: string;
}

const NewCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    patientFirstName: '',
    patientLastName: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'In Queue' as CaseStatus,
    deliveryMethod: 'Pickup' as DeliveryMethod,
    enclosedItems: defaultEnclosedItems,
    otherItems: '',
    isDueDateTBD: false,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductWithShade[]>([]);

  const handleSaveProduct = (product: SavedProduct) => {
    setSelectedProducts(prev => [...prev, product]);
  };

  const handleCategoryChange = (category: ProductCategory | null) => {
    console.log('Category changed:', category);
    setSelectedCategory(category);
  };

  const handleProductsChange = (products: ProductWithShade[]) => {
    console.log('Products changed:', products);
    setSelectedProducts(products);
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientsService.getClients();
        if (Array.isArray(data)) {
          setClients(data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const validationErrors: Partial<FormData> = {};
    if (!formData.clientId) validationErrors.clientId = 'Client is required';
    if (!formData.patientFirstName) validationErrors.patientFirstName = 'Patient first name is required';
    if (!formData.patientLastName) validationErrors.patientLastName = 'Patient last name is required';
    if (!formData.deliveryMethod) validationErrors.deliveryMethod = 'Delivery method is required';
    if (!formData.isDueDateTBD && !formData.dueDate) validationErrors.dueDate = 'Due date is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Create case object
      const newCase: Omit<Case, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: formData.clientId,
        clientName: formData.clientName || '',
        patientFirstName: formData.patientFirstName,
        patientLastName: formData.patientLastName,
        orderDate: formData.orderDate,
        status: formData.status,
        deliveryMethod: formData.deliveryMethod,
        dueDate: formData.isDueDateTBD ? null : formData.dueDate,
        isDueDateTBD: formData.isDueDateTBD || false,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        enclosedItems: formData.enclosedItems,
        otherItems: formData.otherItems || '',
        products: selectedProducts,
        labId: user?.labId || '',
      };

      // Add case to database
      await addCase(newCase);
      toast.success('Case created successfully');
      navigate('/cases');
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        {/* Page Heading */}
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Create a New Case</h1>

        {/* Order Details Section */}
        <div className="bg-white shadow overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
            <h2 className="text-sm font-medium text-white">Order Details</h2>
          </div>
          <div className="p-6 bg-slate-50">
            <OrderDetailsStep
              formData={formData}
              onChange={setFormData}
              errors={errors}
              clients={clients}
              loading={loading}
            />
          </div>
        </div>

        {/* Products & Services */}
        <div className="space-y-4">
          <ProductConfiguration
            selectedCategory={selectedCategory}
            onSave={handleSaveProduct}
            selectedProducts={selectedProducts}
            onProductsChange={handleProductsChange}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Files and Notes Section Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Notes Section */}
          <div className="bg-white shadow overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
              <h2 className="text-sm font-medium text-white">Notes</h2>
            </div>
            <div className="p-6 bg-slate-50">
              <NotesStep
                formData={formData}
                onChange={setFormData}
                errors={errors}
              />
            </div>
          </div>

          {/* Files Section */}
          <div className="bg-white shadow overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-600 bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700">
              <h2 className="text-sm font-medium text-white">Files</h2>
            </div>
            <div className="p-6 bg-slate-50">
              <FilesStep
                formData={formData}
                onChange={setFormData}
                errors={errors}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/cases')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
          >
            Save Case
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewCase;