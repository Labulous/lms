import React, { useState } from 'react';
import DoctorFields from './DoctorFields';

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface ClientFormData {
  clientName: string;
  contactName: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
}

interface AddClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

const AddClientForm: React.FC<AddClientFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    clientName: '',
    contactName: '',
    phone: '',
    email: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    clinicRegistrationNumber: '',
    notes: '',
    doctors: [{ name: '', phone: '', email: '', notes: '' }],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleDoctorChange = (index: number, doctorData: Doctor) => {
    setFormData((prev) => {
      const newDoctors = [...prev.doctors];
      newDoctors[index] = doctorData;
      return { ...prev, doctors: newDoctors };
    });
  };

  const handleDoctorCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10);
    setFormData((prev) => ({
      ...prev,
      doctors: Array(count).fill(null).map((_, i) => prev.doctors[i] || { name: '', phone: '', email: '', notes: '' }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
            <input
              type="text"
              name="clientName"
              id="clientName"
              required
              value={formData.clientName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Contact Name</label>
            <input
              type="text"
              name="contactName"
              id="contactName"
              required
              value={formData.contactName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              name="street"
              id="street"
              required
              value={formData.address.street}
              onChange={handleAddressChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              id="city"
              required
              value={formData.address.city}
              onChange={handleAddressChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              name="state"
              id="state"
              required
              value={formData.address.state}
              onChange={handleAddressChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">Zip Code</label>
            <input
              type="text"
              name="zipCode"
              id="zipCode"
              required
              value={formData.address.zipCode}
              onChange={handleAddressChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="clinicRegistrationNumber" className="block text-sm font-medium text-gray-700">Clinic Registration Number (Optional)</label>
            <input
              type="text"
              name="clinicRegistrationNumber"
              id="clinicRegistrationNumber"
              value={formData.clinicRegistrationNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Doctor Information</h2>
        <div>
          <label htmlFor="doctorCount" className="block text-sm font-medium text-gray-700">Number of Doctors</label>
          <select
            id="doctorCount"
            name="doctorCount"
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
      </div>

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
          Add Client
        </button>
      </div>
    </form>
  );
};

export default AddClientForm;