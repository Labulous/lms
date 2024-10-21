import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClientFilters from './ClientFilters';

interface Client {
  id: string;
  clientName: string;
  contactName: string;
  phone: string;
  email: string;
}

interface ClientListProps {
  clients: Client[];
  onDeleteClient: (clientId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onDeleteClient }) => {
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);

  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

  const handleFilterChange = (filters: { searchTerm: string }) => {
    const filtered = clients.filter(client =>
      client.clientName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  console.log('Rendering ClientList, clients:', clients);
  console.log('Rendering ClientList, filteredClients:', filteredClients);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Clients</h2>
        <Link
          to="/clients/new"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Client
        </Link>
      </div>
      <ClientFilters onFilterChange={handleFilterChange} />
      {filteredClients.length === 0 ? (
        <p>No clients found.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">{client.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.contactName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-900 mr-2">
                    View
                  </Link>
                  <Link to={`/clients/${client.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-2">
                    Edit
                  </Link>
                  <button
                    onClick={() => onDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ClientList;