import React from 'react';

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface DoctorFieldsProps {
  doctor: Doctor;
  onChange: (data: Doctor) => void;
  index: number;
}

const DoctorFields: React.FC<DoctorFieldsProps> = ({ doctor, onChange, index }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...doctor, [name]: value });
  };

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-lg font-medium text-gray-900">Doctor {index + 1}</h3>
      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        <div>
          <label htmlFor={`doctor-name-${index}`} className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            id={`doctor-name-${index}`}
            required
            value={doctor.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor={`doctor-phone-${index}`} className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            name="phone"
            id={`doctor-phone-${index}`}
            required
            value={doctor.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor={`doctor-email-${index}`} className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            id={`doctor-email-${index}`}
            required
            value={doctor.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor={`doctor-notes-${index}`} className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            id={`doctor-notes-${index}`}
            rows={3}
            value={doctor.notes}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default DoctorFields;