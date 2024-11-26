import React, { useState } from 'react';
import DoctorFields from './DoctorFields';
import { ClientInput } from '../../services/clientsService';
import { toast } from 'react-hot-toast';
import { supabase } from '../../config/supabase';

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface AddClientFormProps {
  onSubmit: (data: ClientInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const AddClientForm: React.FC<AddClientFormProps> = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<ClientInput>({
    clientName: '',
    contactName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    clinicRegistrationNumber: '',
    notes: '',
    doctors: [{ name: '', phone: '', email: '', notes: '' }],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDoctorChange = (index: number, field: keyof Doctor, value: string) => {
    setFormData(prev => ({
      ...prev,
      doctors: prev.doctors.map((doctor, i) =>
        i === index ? { ...doctor, [field]: value } : doctor
      ),
    }));
  };

  const addDoctor = () => {
    setFormData(prev => ({
      ...prev,
      doctors: [...prev.doctors, { name: '', phone: '', email: '', notes: '' }],
    }));
  };

  const removeDoctor = (index: number) => {
    if (formData.doctors.length === 1) {
      toast.error('At least one doctor is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      doctors: prev.doctors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First check if we have admin permissions
      const { data: userInfo, error: userError } = await supabase.rpc('get_current_user_info');
      
      if (userError) {
        toast.error('Failed to verify permissions');
        return;
      }
      
      if (!userInfo?.[0] || userInfo[0].user_role !== 'admin') {
        toast.error('Only administrators can add new clients');
        return;
      }

      await onSubmit(formData);
      toast.success('Client added successfully');
    } catch (error) {
      toast.error('Failed to add client');
      console.error('Error adding client:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">Add New Client</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Name</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
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
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Clinic Registration Number</label>
            <input
              type="text"
              name="clinicRegistrationNumber"
              value={formData.clinicRegistrationNumber}
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
          <h3 className="text-lg font-medium mb-4">Doctors</h3>
          {formData.doctors.map((doctor, index) => (
            <DoctorFields
              key={index}
              doctor={doctor}
              onChange={(field, value) => handleDoctorChange(index, field, value)}
              onRemove={() => removeDoctor(index)}
              showRemove={formData.doctors.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={addDoctor}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            + Add Another Doctor
          </button>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddClientForm;