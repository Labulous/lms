import React from 'react';
import { Client, ClientInput, Doctor } from '../../services/clientsService';
import { toast } from 'react-hot-toast';

interface ClientAccountInfoProps {
  client: Client;
  isEditing: boolean;
  editedData: ClientInput | null;
  setEditedData: (data: ClientInput | null) => void;
  onEdit: (clientData: ClientInput) => void;
  onDelete: () => void;
  setIsEditing: (isEditing: boolean) => void;
}

const ClientAccountInfo: React.FC<ClientAccountInfoProps> = ({ 
  client, 
  isEditing, 
  editedData, 
  setEditedData, 
  onEdit, 
  onDelete, 
  setIsEditing 
}) => {
  const handleEditClick = () => {
    const { id, accountNumber, created_at, updated_at, ...clientData } = client;
    setEditedData(clientData);
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => {
      if (!prev) return null;
      if (name.startsWith('address.')) {
        const addressField = name.split('.')[1];
        return {
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value
          }
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleDoctorChange = (index: number, field: keyof Doctor, value: string) => {
    setEditedData(prev => {
      if (!prev) return null;
      const updatedDoctors = [...(prev.doctors || [])];
      if (!updatedDoctors[index]) {
        updatedDoctors[index] = { name: '', email: '', phone: '', notes: '' };
      }
      updatedDoctors[index] = { ...updatedDoctors[index], [field]: value };
      return {
        ...prev,
        doctors: updatedDoctors
      };
    });
  };

  const addDoctor = () => {
    setEditedData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: [...(prev.doctors || []), { name: '', email: '', phone: '', notes: '' }]
      };
    });
  };

  const removeDoctor = (index: number) => {
    setEditedData(prev => {
      if (!prev) return null;
      const updatedDoctors = [...(prev.doctors || [])];
      updatedDoctors.splice(index, 1);
      return {
        ...prev,
        doctors: updatedDoctors
      };
    });
  };

  const handleSave = async () => {
    if (!editedData) return;
    
    try {
      await onEdit(editedData);
      setIsEditing(false);
      toast.success('Client details updated successfully');
    } catch (error) {
      toast.error('Failed to update client details');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const renderField = (label: string, name: string, value: string) => {
    if (name === 'accountNumber') {
      return isEditing ? (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
          <input
            type="text"
            value={client.accountNumber}
            disabled
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
          />
        </div>
      ) : (
        <div className="mb-4">
          <span className="block text-gray-700 text-sm font-bold mb-2">{label}</span>
          <span className="text-gray-700">{client.accountNumber}</span>
        </div>
      );
    }

    return isEditing ? (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
        <input
          type="text"
          name={name}
          value={editedData?.[name] || ''}
          onChange={handleInputChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
    ) : (
      <div className="mb-4">
        <span className="block text-gray-700 text-sm font-bold mb-2">{label}</span>
        <span className="text-gray-700">{value}</span>
      </div>
    );
  };

  const renderAddressField = (label: string, field: string, value: string) => {
    return isEditing ? (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
        <input
          type="text"
          name={`address.${field}`}
          value={editedData?.address?.[field] || ''}
          onChange={handleInputChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
    ) : (
      <div className="mb-4">
        <span className="block text-gray-700 text-sm font-bold mb-2">{label}</span>
        <span className="text-gray-700">{value}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Account Details</h2>
        <div className="space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleEditClick}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          {renderField('Account Number', 'accountNumber', client.accountNumber)}
          {renderField('Client Name', 'clientName', client.clientName)}
          {renderField('Contact Name', 'contactName', client.contactName)}
          {renderField('Phone', 'phone', client.phone)}
          {renderField('Email', 'email', client.email)}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          {renderAddressField('Street', 'street', client.address.street)}
          {renderAddressField('City', 'city', client.address.city)}
          {renderAddressField('State', 'state', client.address.state)}
          {renderAddressField('Zip Code', 'zipCode', client.address.zipCode)}
        </div>
      </div>

      <div className="mt-6">
        {renderField('Clinic Registration Number', 'clinicRegistrationNumber', client.clinicRegistrationNumber)}
        {renderField('Notes', 'notes', client.notes || '')}
      </div>

      {/* Doctors Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Doctors</h3>
          {isEditing && (
            <button
              onClick={addDoctor}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Add Doctor
            </button>
          )}
        </div>
        {(!client.doctors || client.doctors.length === 0) ? (
          <p className="text-gray-500">No doctors assigned</p>
        ) : (
          <div className="space-y-4">
            {(isEditing ? editedData?.doctors : client.doctors)?.map((doctor, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                {isEditing ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Doctor #{index + 1}</h4>
                      <button
                        onClick={() => removeDoctor(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={doctor.name}
                          onChange={(e) => handleDoctorChange(index, 'name', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={doctor.email}
                          onChange={(e) => handleDoctorChange(index, 'email', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={doctor.phone}
                          onChange={(e) => handleDoctorChange(index, 'phone', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <input
                          type="text"
                          value={doctor.notes || ''}
                          onChange={(e) => handleDoctorChange(index, 'notes', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h4 className="font-medium text-lg mb-2">{doctor.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Email:</span> {doctor.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {doctor.phone}
                      </div>
                      {doctor.notes && (
                        <div className="col-span-2">
                          <span className="font-medium">Notes:</span> {doctor.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAccountInfo;