import React from 'react';
import { Client } from '../../data/mockClientsData';

interface ClientAccountInfoProps {
  client: Client;
}

const ClientAccountInfo: React.FC<ClientAccountInfoProps> = ({ client }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Client Account Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Account Details</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-900">Account #: {client.accountNumber}</p>
            <p className="text-sm text-gray-900">Client Name: {client.clientName}</p>
            <p className="text-sm text-gray-900">Registration #: {client.clinicRegistrationNumber}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-900">Contact: {client.contactName}</p>
            <p className="text-sm text-gray-900">Phone: {client.phone}</p>
            <p className="text-sm text-gray-900">Email: {client.email}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Address</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-900">{client.address.street}</p>
            <p className="text-sm text-gray-900">
              {client.address.city}, {client.address.state} {client.address.zipCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAccountInfo;