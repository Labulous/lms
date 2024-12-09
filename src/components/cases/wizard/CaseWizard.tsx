import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import OrderDetailsStep from './steps/OrderDetailsStep';
import ProductsServicesStep from './steps/ProductsServicesStep';
import FilesStep from './steps/FilesStep';
import NotesStep from './steps/NotesStep';
import { Case, CaseStatus, DeliveryMethod, addCase } from '../../../data/mockCasesData';
import { Client, clientsService } from '../../../services/clientsService';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { createLogger } from '../../../utils/logger';

const logger = createLogger({ module: 'CaseWizard' });

type WizardStep = 'order' | 'products' | 'files' | 'notes';

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

interface CaseWizardProps {
  onClose: () => void;
  onSave: (caseData: Case) => void;
  initialStep?: WizardStep;
}

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

const CaseWizard: React.FC<CaseWizardProps> = ({ onClose, onSave, initialStep = 'order' }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
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

  console.log('CaseWizard rendering:', { user, authLoading, clients });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Starting client fetch...');
        setLoading(true);
        const data = await clientsService.getClients();
        console.log('Client fetch response:', data);
        if (Array.isArray(data)) {
          setClients(data);
          console.log('Clients set in state:', data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      console.log('Fetching clients for user:', user.id);
      fetchClients();
    }
  }, [user, authLoading]);

  useEffect(() => {
    logger.debug('CaseWizard state updated:', {
      clientsCount: clients.length,
      loading,
      currentStep,
      hasUser: !!user,
      userRole: user?.role
    });
  }, [clients, loading, currentStep, user]);

  // Log initial state
  console.log('Initial Form Data:', formData);
  console.log('Available Clients:', clients);

  const handleFormChange = (newFormData: FormData) => {
    console.log('Form Data Changed:', newFormData);
    const client = clients.find(c => c.id === newFormData.clientId);
    console.log('Found Client:', client);
    if (client) {
      setFormData({ ...newFormData, clientName: client.clientName });
    } else {
      setFormData(newFormData);
    }
  };

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'order', label: 'Order Details' },
    { key: 'products', label: 'Products & Services' },
    { key: 'files', label: 'Files' },
    { key: 'notes', label: 'Notes' },
  ];

  const validateStep = (): boolean => {
    const newErrors: Partial<FormData> = {};

    switch (currentStep) {
      case 'order':
        if (!formData.clientId) newErrors.clientId = 'Client is required';
        if (!formData.orderDate) newErrors.orderDate = 'Order date is required';
        if (!formData.isDueDateTBD && !formData.dueDate) {
          newErrors.dueDate = 'Due date is required when not TBD';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSave = () => {
    if (!validateStep()) return;

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      setErrors({ clientId: 'Invalid client selected' });
      return;
    }

    // Generate a new case object
    const newCase: Case = {
      id: Date.now().toString(),
      caseId: `CASE${Date.now().toString().slice(-6)}`,
      clientId: formData.clientId,
      clientName: client.clientName,
      patientName: `${formData.patientFirstName} ${formData.patientLastName}`,
      caseType: 'Standard', // Default type
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

    // Add the case to our mock database
    addCase(newCase);
    
    // Call the onSave callback
    onSave(newCase);
    
    // Close the wizard and navigate
    onClose();
    navigate('/cases');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'order':
        return (
          <OrderDetailsStep
            formData={formData}
            onChange={handleFormChange}
            errors={errors}
            clients={clients}
            loading={loading}
          />
        );
      case 'products':
        return (
          <ProductsServicesStep />
        );
      case 'files':
        return (
          <FilesStep
            onFileUpload={(files) => setFormData({ ...formData, files })}
            enclosedItems={formData.enclosedItems || defaultEnclosedItems}
            onEnclosedItemsChange={(items) => setFormData({ ...formData, enclosedItems: items })}
            otherItems={formData.otherItems}
            onOtherItemsChange={(value) => setFormData({ ...formData, otherItems: value })}
          />
        );
      case 'notes':
        return (
          <NotesStep
            notes={formData.notes}
            onChange={(notes) => setFormData({ ...formData, notes })}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">New Case</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="mb-8">
          <nav className="flex">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`flex-1 ${
                  index > 0 ? 'ml-4' : ''
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    currentStep === step.key
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </div>
                <div
                  className={`mt-2 h-1 rounded-full ${
                    currentStep === step.key
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </nav>
        </div>

        {renderStep()}

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex space-x-2">
            {currentStep !== 'order' && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            {currentStep !== 'notes' ? (
              <Button
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
              >
                Create Case
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseWizard;