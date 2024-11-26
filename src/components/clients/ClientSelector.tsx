import React from 'react';
import { Client } from '../../data/mockClientsData';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClientId,
  onClientChange,
}) => {
  return (
    <div className="w-full max-w-md">
      <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Client
      </label>
      <select
        id="client-select"
        value={selectedClientId}
        onChange={(e) => onClientChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Select a client</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.accountNumber} - {client.clientName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientSelector;