import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../../services/clientsService';

interface ClientDetailsProps {
  client: Client | null;
  onEdit: () => void;
  onDelete: () => void;
  loading: boolean;
  error: string | null;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onDelete, loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-500">{error}</div>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 text-blue-500 hover:text-blue-700"
        >
          Return to Clients List
        </button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-500">No client data available. Please try again.</div>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 text-blue-500 hover:text-blue-700"
        >
          Return to Clients List
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Client Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Account #{client.accountNumber}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this client?')) {
                onDelete();
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Client Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.clientName}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Contact Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.contactName}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.email}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.phone}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {client.address.street}<br />
              {client.address.city}, {client.address.state} {client.address.zipCode}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Clinic Registration Number</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.clinicRegistrationNumber}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.notes}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Account Number</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.accountNumber}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Doctors</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {client.doctors && client.doctors.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {client.doctors.map((doctor, index) => (
                    <li key={doctor.id || index} className="py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-gray-500">Email: {doctor.email}</div>
                        <div className="text-gray-500">Phone: {doctor.phone}</div>
                        {doctor.notes && (
                          <div className="text-gray-500">Notes: {doctor.notes}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No doctors assigned</p>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ClientDetails;