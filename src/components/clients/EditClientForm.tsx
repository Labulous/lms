import React, { useState, useEffect } from 'react';
import DoctorFields from './DoctorFields';
import { Client, ClientInput } from '../../services/clientsService';
import { toast } from 'react-hot-toast';

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface EditClientFormProps {
  client: Client | null;
  onSubmit: (data: ClientInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EditClientForm: React.FC<EditClientFormProps> = ({ client, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<ClientInput | null>(null);

  useEffect(() => {
    if (client) {
      // Keep account_number in the form data but remove other server-side fields
      const { id, created_at, updated_at, ...clientData } = client;
      setFormData(clientData);
    }
  }, [client]);

  if (!formData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleDoctorChange = (index: number, field: keyof Doctor, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: prev.doctors.map((doctor, i) =>
          i === index ? { ...doctor, [field]: value } : doctor
        ),
      };
    });
  };

  const addDoctor = () => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: [...prev.doctors, { name: '', phone: '', email: '', notes: '' }],
      };
    });
  };

  const removeDoctor = (index: number) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: prev.doctors.filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData) return;
      await onSubmit(formData);
      toast.success('Client updated successfully');
    } catch (error) {
      toast.error('Failed to update client');
      console.error('Error updating client:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Edit Client</h2>

        {/* Account Number Display */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Account Number</label>
          <div className="mt-1 relative">
            <div 
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 select-none"
              aria-readonly="true"
            >
              {client?.account_number || ''}
            </div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">Account number cannot be modified</p>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Name</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              name="street_address"
              value={formData.street_address}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Clinic Registration Number</label>
            <input
              type="text"
              name="clinic_registration_number"
              value={formData.clinic_registration_number}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Doctors</h3>
          {formData.doctors.map((doctor, index) => (
            <DoctorFields
              key={index}
              doctor={doctor}
              onChange={(field, value) => handleDoctorChange(index, field as keyof Doctor, value)}
              onRemove={() => removeDoctor(index)}
              showRemove={formData.doctors.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={addDoctor}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Another Doctor
          </button>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Client...
              </>
            ) : (
              'Update Client'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditClientForm;