import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClientFilters from './ClientFilters';
import { Client } from '../../services/clientsService';

interface ClientListProps {
  clients: Client[];
  loading: boolean;
  onDeleteClient: (clientId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, loading, onDeleteClient }) => {
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const navigate = useNavigate();

  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

  const handleFilterChange = (filters: { searchTerm: string }) => {
    const filtered = clients.filter(client =>
      client.clientName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      client.accountNumber.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
        <p className="text-gray-500 text-center py-4">No clients found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Account #</th>
                <th className="px-4 py-2 text-left">Client Name</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{client.accountNumber}</td>
                  <td className="px-4 py-2">{client.clientName}</td>
                  <td className="px-4 py-2">{client.contactName}</td>
                  <td className="px-4 py-2">{client.email}</td>
                  <td className="px-4 py-2">{client.phone}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-blue-500 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                      <Link
                        to={`/clients/${client.id}/edit`}
                        className="text-green-500 hover:text-green-700 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this client?')) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;