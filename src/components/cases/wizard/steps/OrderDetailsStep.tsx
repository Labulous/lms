import React, { useEffect } from 'react';
import { CASE_STATUSES, DELIVERY_METHODS, CaseStatus, DeliveryMethod } from '../../../../data/mockCasesData';
import { Client } from '../../../../services/clientsService';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger({ module: 'OrderDetailsStep' });

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
}

interface OrderDetailsStepProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors?: Partial<FormData>;
  clients: Client[];
  loading?: boolean;
}

const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  formData,
  onChange,
  errors = {},
  clients = [],
  loading = false,
}) => {
  // Debug log for initial render and props
  console.log('OrderDetailsStep rendering with props:', {
    hasFormData: !!formData,
    clientsCount: clients?.length,
    clientIds: clients?.map(c => c.id),
    loading,
    errors
  });

  useEffect(() => {
    console.log('OrderDetailsStep clients changed:', {
      clientsCount: clients?.length,
      clients: clients?.map(c => ({ id: c.id, name: c.clientName }))
    });
  }, [clients]);

  useEffect(() => {
    logger.debug('OrderDetailsStep props updated', {
      hasFormData: !!formData,
      clientsLength: clients?.length,
      loading,
      selectedClientId: formData?.clientId,
      selectedClient: clients?.find(c => c.id === formData?.clientId),
      errors: Object.keys(errors || {})
    });
  }, [formData, clients, loading, errors]);

  // Debug logs
  useEffect(() => {
    console.log('OrderDetailsStep props:', {
      hasFormData: !!formData,
      clientsLength: clients.length,
      clients,
      loading,
      errors
    });
  }, [formData, clients, loading, errors]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    console.log('Input changed:', { name, value });
    if (type === 'checkbox') {
      const checkbox = event.target as HTMLInputElement;
      onChange({
        ...formData,
        [name]: checkbox.checked,
        ...(name === 'isDueDateTBD' && checkbox.checked ? { dueDate: undefined } : {}),
      });
    } else {
      onChange({
        ...formData,
        [name]: value,
      });
    }
  };

  // Find the selected client
  const selectedClient = (clients || []).find(client => client.id === formData.clientId);
  console.log('Selected Client:', selectedClient);
  console.log('Form Data:', formData);
  console.log('Available Clients:', clients);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="grid grid-cols-12 gap-6">
        {/* Column 1: Client Selection */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                Client *
              </label>
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading clients...</span>
                  </div>
                ) : (
                  <>
                    <select
                      id="clientId"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm h-10 ${
                        errors.clientId 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                      } bg-white`}
                    >
                      <option value="">Select a client</option>
                      {clients && clients.length > 0 ? (
                        clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.clientName || 'Unnamed Client'}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No clients available</option>
                      )}
                    </select>
                    {errors.clientId && (
                      <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Client Details */}
            {selectedClient && (
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Client Details</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">{selectedClient.clientName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedClient.address.street}<br />
                    {selectedClient.address.city}, {selectedClient.address.state} {selectedClient.address.zipCode}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Patient Info */}
        <div className="col-span-4 space-y-4">
          <div>
            <label htmlFor="patientFirstName" className="block text-sm font-medium text-gray-700">
              Patient First Name *
            </label>
            <input
              type="text"
              id="patientFirstName"
              name="patientFirstName"
              value={formData.patientFirstName}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm h-10 ${
                errors.patientFirstName 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
              } bg-white`}
            />
            {errors.patientFirstName && <p className="mt-1 text-sm text-red-600">{errors.patientFirstName}</p>}
          </div>

          <div>
            <label htmlFor="patientLastName" className="block text-sm font-medium text-gray-700">
              Patient Last Name *
            </label>
            <input
              type="text"
              id="patientLastName"
              name="patientLastName"
              value={formData.patientLastName}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm h-10 ${
                errors.patientLastName 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
              } bg-white`}
            />
            {errors.patientLastName && <p className="mt-1 text-sm text-red-600">{errors.patientLastName}</p>}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 sm:text-sm h-10 bg-white"
            >
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Column 3: Dates and Delivery */}
        <div className="col-span-4 space-y-4">
          <div>
            <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">
              Order Date
            </label>
            <input
              type="date"
              id="orderDate"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 sm:text-sm h-10 bg-white"
            />
          </div>

          <div>
            <label htmlFor="deliveryMethod" className="block text-sm font-medium text-gray-700">
              Delivery Method
            </label>
            <select
              id="deliveryMethod"
              name="deliveryMethod"
              value={formData.deliveryMethod}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 sm:text-sm h-10 bg-white"
            >
              {DELIVERY_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDueDateTBD"
                name="isDueDateTBD"
                checked={formData.isDueDateTBD}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isDueDateTBD" className="ml-2 block text-sm text-gray-700">
                Due Date TBD
              </label>
            </div>
            {!formData.isDueDateTBD && (
              <div className="mt-2">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 sm:text-sm h-10 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsStep;