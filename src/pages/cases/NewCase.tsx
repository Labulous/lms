import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Case, CaseStatus, DeliveryMethod, addCase } from '../../data/mockCasesData';
import { mockClients } from '../../data/mockClientsData';
import { ProductCategory, PRODUCT_CATEGORIES } from '../../data/mockProductData';
import OrderDetailsStep from '../../components/cases/wizard/steps/OrderDetailsStep';
import FilesStep from '../../components/cases/wizard/steps/FilesStep';
import NotesStep from '../../components/cases/wizard/steps/NotesStep';
import ToothSelector from '../../components/cases/wizard/modals/ToothSelector';
import ProductConfiguration from '../../components/cases/wizard/ProductConfiguration';
import { SavedProduct } from '../../components/cases/wizard/modals/AddProductModal';

interface FormData {
  clientId: string;
  patientFirstName?: string;
  patientLastName?: string;
  orderDate: string;
  dueDate?: string;
  isDueDateTBD: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  status: CaseStatus;
  assignedTechnicians: string[];
  deliveryMethod: DeliveryMethod;
  notes?: {
    labNotes?: string;
    technicianNotes?: string;
  };
  files?: File[];
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
}

const NewCase: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    orderDate: new Date().toISOString().split('T')[0],
    status: 'In Queue',
    assignedTechnicians: [],
    deliveryMethod: 'Local Delivery',
    isDueDateTBD: false,
    enclosedItems: {
      impression: 0,
      biteRegistration: 0,
      photos: 0,
      jig: 0,
      opposingModel: 0,
      articulator: 0,
      returnArticulator: 0,
      cadcamFiles: 0,
      consultRequested: 0,
    },
  });
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.orderDate) newErrors.orderDate = 'Order date is required';
    if (!formData.isDueDateTBD && !formData.dueDate) {
      newErrors.dueDate = 'Due date is required when not TBD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const client = mockClients.find(c => c.id === formData.clientId);
    if (!client) {
      setErrors({ clientId: 'Invalid client selected' });
      return;
    }

    const patientName = [formData.patientFirstName, formData.patientLastName]
      .filter(Boolean)
      .join(' ');

    const newCase: Case = {
      id: Date.now().toString(),
      caseId: `CASE${Date.now().toString().slice(-6)}`,
      clientId: formData.clientId,
      clientName: client.clientName,
      patientName: patientName || undefined,
      caseType: 'Standard',
      caseStatus: formData.status,
      startDate: formData.orderDate,
      dueDate: formData.isDueDateTBD ? formData.orderDate : formData.dueDate || formData.orderDate,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      assignedTechnicians: formData.assignedTechnicians,
      deliveryMethod: formData.deliveryMethod,
      notes: formData.notes,
      stages: [
        { name: 'Initial Review', status: 'pending' },
        { name: 'Production', status: 'pending' },
        { name: 'Quality Check', status: 'pending' },
        { name: 'Completion', status: 'pending' },
      ],
    };

    addCase(newCase);
    navigate('/cases');
  };

  const handleProductSave = (product: SavedProduct) => {
    setSelectedProducts(prev => [...prev, product]);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Create New Case</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Save Case
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Case Details Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Case Details</h2>
          <OrderDetailsStep
            formData={formData}
            onChange={setFormData}
            errors={errors}
          />
        </div>

        {/* Products Section */}
        <div className="grid grid-cols-6 gap-6">
          {/* Categories */}
          <div className="col-span-1 bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Categories</h2>
            <div className="space-y-1">
              {PRODUCT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    w-full px-3 py-2 text-left rounded-lg transition-colors
                    ${selectedCategory === category
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                    border text-sm
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Configuration */}
          <div className="col-span-5 bg-white shadow-sm rounded-lg p-6">
            <ProductConfiguration
              selectedCategory={selectedCategory}
              onSave={handleProductSave}
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
            />
          </div>
        </div>

        {/* Files and Notes Section */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>
            <FilesStep
              onFileUpload={(files) => setFormData({ ...formData, files })}
            />
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
            <NotesStep
              notes={formData.notes}
              onChange={(notes) => setFormData({ ...formData, notes })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCase;