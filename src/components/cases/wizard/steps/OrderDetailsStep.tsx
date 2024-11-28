import React, { useEffect } from 'react';
import { CASE_STATUSES, DELIVERY_METHODS, CaseStatus, DeliveryMethod } from '../../../../data/mockCasesData';
import { Client } from '../../../../services/clientsService';
import { createLogger } from '../../../../utils/logger';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
    <div className="bg-slate-50 rounded-lg shadow-sm">
      <div className="grid grid-cols-12 gap-6">
        {/* Column 1: Client Selection */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="clientId" className="text-xs">Client *</Label>
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading clients...</span>
                  </div>
                ) : (
                  <>
                    <Select
                      name="clientId"
                      value={formData.clientId}
                      onValueChange={(value) => {
                        onChange({
                          ...formData,
                          clientId: value,
                        });
                      }}
                    >
                      <SelectTrigger className={errors.clientId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients && clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.clientName || 'Unnamed Client'}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No clients available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.clientId && (
                      <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-0">
              <Label htmlFor="patientFirstName" className="text-xs">Patient First Name *</Label>
              <Input
                type="text"
                id="patientFirstName"
                name="patientFirstName"
                value={formData.patientFirstName}
                onChange={handleInputChange}
                className={errors.patientFirstName ? "border-red-500" : ""}
              />
              {errors.patientFirstName && (
                <p className="mt-1 text-sm text-red-600">{errors.patientFirstName}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="patientLastName" className="text-xs">Patient Last Name *</Label>
              <Input
                type="text"
                id="patientLastName"
                name="patientLastName"
                value={formData.patientLastName}
                onChange={handleInputChange}
                className={errors.patientLastName ? "border-red-500" : ""}
              />
              {errors.patientLastName && (
                <p className="mt-1 text-sm text-red-600">{errors.patientLastName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Order Details */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="orderDate" className="text-xs">Order Date *</Label>
              <Input
                type="date"
                id="orderDate"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                className={errors.orderDate ? "border-red-500" : ""}
              />
              {errors.orderDate && (
                <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="status" className="text-xs">Status *</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => {
                  onChange({
                    ...formData,
                    status: value as CaseStatus,
                  });
                }}
              >
                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="deliveryMethod" className="text-xs">Delivery Method *</Label>
              <Select
                name="deliveryMethod"
                value={formData.deliveryMethod}
                onValueChange={(value) => {
                  onChange({
                    ...formData,
                    deliveryMethod: value as DeliveryMethod,
                  });
                }}
              >
                <SelectTrigger className={errors.deliveryMethod ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deliveryMethod && (
                <p className="mt-1 text-sm text-red-600">{errors.deliveryMethod}</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Due Date & Appointment */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="dueDate" className="text-xs">Due Date</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="isDueDateTBD" className="text-xs">TBD</Label>
                  <Checkbox
                    id="isDueDateTBD"
                    name="isDueDateTBD"
                    checked={formData.isDueDateTBD}
                    onCheckedChange={(checked) => {
                      onChange({
                        target: {
                          name: 'isDueDateTBD',
                          value: checked,
                        },
                      });
                      onChange({
                        isDueDateTBD: checked as boolean,
                        ...(checked ? { dueDate: undefined } : {}),
                      });
                    }}
                  />
                </div>
              </div>

              {!formData.isDueDateTBD && (
                <Input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate || ''}
                  onChange={onChange}
                  className={errors.dueDate ? "border-red-500" : ""}
                />
              )}
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="appointmentDate" className="text-xs">Appointment Date</Label>
              <Input
                type="date"
                id="appointmentDate"
                name="appointmentDate"
                value={formData.appointmentDate || ''}
                onChange={handleInputChange}
                className={errors.appointmentDate ? "border-red-500" : ""}
              />
              {errors.appointmentDate && (
                <p className="mt-1 text-sm text-red-600">{errors.appointmentDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="appointmentTime" className="text-xs">Appointment Time</Label>
              <Input
                type="time"
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime || ''}
                onChange={handleInputChange}
                className={errors.appointmentTime ? "border-red-500" : ""}
              />
              {errors.appointmentTime && (
                <p className="mt-1 text-sm text-red-600">{errors.appointmentTime}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsStep;