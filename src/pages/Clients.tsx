import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ClientList from '../components/clients/ClientList';
import ClientDetails from '../components/clients/ClientDetails';
import AddClientForm from '../components/clients/AddClientForm';
import EditClientForm from '../components/clients/EditClientForm';
import { getClients, addClient, updateClient, deleteClient, Client } from '../data/mockClientsData';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (clientId) {
      loadClientDetails(clientId);
    }
  }, [clientId]);

  const loadClients = () => {
    try {
      setLoading(true);
      const allClients = getClients();
      setClients(allClients);
    } catch (err) {
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadClientDetails = (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const clientData = clients.find(client => client.id === id);
      if (clientData) {
        setSelectedClient(clientData);
      } else {
        setError('Client not found');
      }
    } catch (err) {
      setError('Failed to load client details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = (clientData: Omit<Client, 'id' | 'accountNumber'>) => {
    try {
      addClient(clientData);
      loadClients(); // Reload the client list
      navigate('/clients');
    } catch (err) {
      setError('Failed to add client. Please try again.');
    }
  };

  const handleEditClient = (clientId: string, clientData: Omit<Client, 'id' | 'accountNumber'>) => {
    try {
      updateClient(clientId, clientData);
      loadClients(); // Reload the client list
      navigate(`/clients/${clientId}`);
    } catch (err) {
      setError('Failed to update client. Please try again.');
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        deleteClient(clientId);
        loadClients(); // Reload the client list
        navigate('/clients');
      } catch (err) {
        setError('Failed to delete client. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route index element={<ClientList clients={clients} onDeleteClient={handleDeleteClient} />} />
        <Route path="new" element={<AddClientForm onSubmit={handleAddClient} onCancel={() => navigate('/clients')} />} />
        <Route path=":clientId" element={
          <ClientDetails
            client={selectedClient}
            onEdit={() => navigate(`/clients/${clientId}/edit`)}
            onDelete={() => handleDeleteClient(clientId!)}
            loading={loading}
            error={error}
          />
        } />
        <Route path=":clientId/edit" element={
          <EditClientForm
            client={selectedClient}
            onSubmit={(data) => handleEditClient(clientId!, data)}
            onCancel={() => navigate(`/clients/${clientId}`)}
          />
        } />
      </Routes>
    </div>
  );
};

export default Clients;