import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import OrderDetailsStep from './steps/OrderDetailsStep';
import ProductsServicesStep from './steps/ProductsServicesStep';
import FilesStep from './steps/FilesStep';
import NotesStep from './steps/NotesStep';
import { Case, CaseStatus, DeliveryMethod, addCase } from '../../../data/mockCasesData';
import { mockClients } from '../../../data/mockClientsData';

type WizardStep = 'order' | 'products' | 'files' | 'notes';

interface FormData {
  clientId: string;
  patientName?: string;
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
}

interface CaseWizardProps {
  onClose: () => void;
  onSave: (caseData: Case) => void;
}

const CaseWizard: React.FC<CaseWizardProps> = ({ onClose, onSave }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('order');
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    orderDate: new Date().toISOString().split('T')[0],
    status: 'In Queue',
    assignedTechnicians: [],
    deliveryMethod: 'Local Delivery',
    isDueDateTBD: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

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

    const client = mockClients.find(c => c.id === formData.clientId);
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
      patientName: formData.patientName,
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
            onChange={setFormData}
            errors={errors}
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Create New Case</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Progress Steps */}
            <div className="mt-4">
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step.key === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-600">{step.label}</span>
                    {index < steps.length - 1 && (
                      <div className="w-12 h-1 mx-4 bg-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="flex space-x-2">
                {currentStep !== 'order' && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {currentStep !== 'notes' ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Create Case
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseWizard;