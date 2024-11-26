import React from 'react';
import { mockClients } from '../../../../data/mockClientsData';
import { CASE_STATUSES, DELIVERY_METHODS } from '../../../../data/mockCasesData';

interface FormData {
  clientId: string;
  patientFirstName?: string;
  patientLastName?: string;
  orderDate: string;
  dueDate?: string;
  isDueDateTBD: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  status: string;
  deliveryMethod: string;
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

interface OrderDetailsStepProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors: Partial<FormData>;
}

const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  formData,
  onChange,
  errors,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'isDueDateTBD') {
      const isChecked = (e.target as HTMLInputElement).checked;
      onChange({
        ...formData,
        isDueDateTBD: isChecked,
        dueDate: isChecked ? undefined : formData.dueDate,
      });
    } else if (name.startsWith('enclosed.')) {
      const itemName = name.split('.')[1];
      onChange({
        ...formData,
        enclosedItems: {
          ...formData.enclosedItems,
          [itemName]: parseInt(value) || 0,
        },
      });
    } else {
      onChange({
        ...formData,
        [name]: value,
      });
    }
  };

  const enclosedItemsList = [
    { key: 'impression', label: 'Impression' },
    { key: 'biteRegistration', label: 'Bite registration' },
    { key: 'photos', label: 'Photos' },
    { key: 'jig', label: 'Jig' },
    { key: 'opposingModel', label: 'Opposing Model' },
    { key: 'articulator', label: 'Articulator' },
    { key: 'returnArticulator', label: 'Return Articulator' },
    { key: 'cadcamFiles', label: 'CAD/CAM Files' },
    { key: 'consultRequested', label: 'Consult Requested' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-10 gap-6">
        {/* Column 1: Client and Patient Info (4 cols) */}
        <div className="col-span-4 space-y-6">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
              Client *
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.clientId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="">Select a client</option>
              {mockClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.clientName}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="patientFirstName" className="block text-sm font-medium text-gray-700">
                Patient First Name
              </label>
              <input
                type="text"
                id="patientFirstName"
                name="patientFirstName"
                value={formData.patientFirstName || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="patientLastName" className="block text-sm font-medium text-gray-700">
                Patient Last Name
              </label>
              <input
                type="text"
                id="patientLastName"
                name="patientLastName"
                value={formData.patientLastName || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Dates and Status (4 cols) */}
        <div className="col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {CASE_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {DELIVERY_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">
                Order Date *
              </label>
              <input
                type="date"
                id="orderDate"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.orderDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.orderDate && <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDueDateTBD"
                    name="isDueDateTBD"
                    checked={formData.isDueDateTBD}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDueDateTBD" className="ml-2 text-sm text-gray-500">
                    TBD
                  </label>
                </div>
              </div>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate || ''}
                onChange={handleInputChange}
                disabled={formData.isDueDateTBD}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formData.isDueDateTBD ? 'bg-gray-100' : ''
                } ${
                  errors.dueDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
                Appointment Date
              </label>
              <input
                type="date"
                id="appointmentDate"
                name="appointmentDate"
                value={formData.appointmentDate || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">
                Appointment Time
              </label>
              <input
                type="time"
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Enclosed Items (2 cols) */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Enclosed With Case</h3>
          <div className="space-y-2">
            {enclosedItemsList.map(item => (
              <div key={item.key} className="flex items-center space-x-2">
                <input
                  type="number"
                  name={`enclosed.${item.key}`}
                  value={formData.enclosedItems[item.key as keyof typeof formData.enclosedItems]}
                  onChange={handleInputChange}
                  min="0"
                  className="w-16 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <label className="text-sm text-gray-600">
                  {item.label}
                </label>
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="otherItems" className="block text-sm font-medium text-gray-700">
              Other items:
            </label>
            <textarea
              id="otherItems"
              name="otherItems"
              value={formData.otherItems || ''}
              onChange={handleInputChange}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsStep;