import React, { useState, useEffect } from 'react';
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

interface EditClientFormProps {
  client: ClientFormData | null;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

const EditClientForm: React.FC<EditClientFormProps> = ({ client, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ClientFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      setFormData(client);
      setLoading(false);
    }
  }, [client]);

  if (loading) {
    return <div>Loading client data...</div>;
  }

  if (!formData) {
    return <div>Error: No client data available.</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? ({
      ...prev,
      [name]: value,
    }) : null);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }) : null);
  };

  const handleDoctorChange = (index: number, doctorData: Doctor) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newDoctors = [...prev.doctors];
      newDoctors[index] = doctorData;
      return { ...prev, doctors: newDoctors };
    });
  };

  const handleDoctorCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10);
    setFormData((prev) => {
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

      {/* Add other client fields here */}

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