import React, { useState, useEffect } from 'react';
import DoctorFields from './DoctorFields';
import { Client } from '../../data/mockClientsData';

interface EditClientFormProps {
  client: Client | null;
  onSubmit: (data: Omit<Client, 'id'>) => void;
  onCancel: () => void;
}

const EditClientForm: React.FC<EditClientFormProps> = ({ client, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'> | null>(null);

  useEffect(() => {
    if (client) {
      const { id, ...clientData } = client;
      setFormData(clientData);
    }
  }, [client]);

  if (!formData) {
    return <div>Loading client data...</div>;
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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        address: { ...prev.address, [name]: value },
      };
    });
  };

  const handleDoctorChange = (index: number, doctorData: Client['doctors'][0]) => {
    setFormData(prev => {
      if (!prev) return null;
      const newDoctors = [...prev.doctors];
      newDoctors[index] = doctorData;
      return { ...prev, doctors: newDoctors };
    });
  };

  const handleDoctorCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10);
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: Array(count).fill(null).map((_, i) => prev.doctors[i] || { name: '', phone: '', email: '', notes: '' }),
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
        <input
          type="text"
          name="clientName"
          id="clientName"
          value={formData.clientName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Contact Name</label>
        <input
          type="text"
          name="contactName"
          id="contactName"
          value={formData.contactName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street</label>
        <input
          type="text"
          name="street"
          id="street"
          value={formData.address.street}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            name="city"
            id="city"
            value={formData.address.city}
            onChange={handleAddressChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
          <input
            type="text"
            name="state"
            id="state"
            value={formData.address.state}
            onChange={handleAddressChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">ZIP Code</label>
          <input
            type="text"
            name="zipCode"
            id="zipCode"
            value={formData.address.zipCode}
            onChange={handleAddressChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="clinicRegistrationNumber" className="block text-sm font-medium text-gray-700">Clinic Registration Number</label>
        <input
          type="text"
          name="clinicRegistrationNumber"
          id="clinicRegistrationNumber"
          value={formData.clinicRegistrationNumber}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          id="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="doctorCount" className="block text-sm font-medium text-gray-700">Number of Doctors</label>
        <select
          id="doctorCount"
          value={formData.doctors.length}
          onChange={handleDoctorCountChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {formData.doctors.map((doctor, index) => (
        <DoctorFields
          key={index}
          doctor={doctor}
          onChange={(data) => handleDoctorChange(index, data)}
          index={index}
        />
      ))}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Update Client
        </button>
      </div>
    </form>
  );
};

export default EditClientForm;