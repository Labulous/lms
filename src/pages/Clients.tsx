import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import ClientList from '../components/clients/ClientList';
import ClientDetails from '../components/clients/ClientDetails';
import AddClientForm from '../components/clients/AddClientForm';
import EditClientForm from '../components/clients/EditClientForm';
import { fetchClients, fetchClientDetails, addClient, updateClient, deleteClient } from '../services/api';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId } = useParams<{ clientId: string }>();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (clientId) {
      console.log('Loading client details for ID:', clientId);
      loadClientDetails(clientId);
    } else {
      console.log('No clientId, setting selectedClient to null');
      setSelectedClient(null);
    }
  }, [clientId, location]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await fetchClients();
      console.log('Fetched clients:', data);
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadClientDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching client details...');
      const clientData = await fetchClientDetails(id);
      console.log('Fetched client data:', clientData);
      setSelectedClient(clientData);
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError('Failed to load client details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (clientData: any) => {
    try {
      const newClient = await addClient(clientData);
      setClients([...clients, newClient]);
      navigate('/clients');
    } catch (err) {
      console.error('Error adding client:', err);
      setError('Failed to add client. Please try again.');
    }
  };

  const handleEditClient = async (clientId: string, clientData: any) => {
    try {
      const updatedClient = await updateClient(clientId, clientData);
      setClients(clients.map(client => client.id === clientId ? updatedClient : client));
      setSelectedClient(updatedClient);
      navigate(`/clients/${clientId}`);
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Failed to update client. Please try again.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(clientId);
        setClients(clients.filter(client => client.id !== clientId));
        navigate('/clients');
      } catch (err) {
        console.error('Error deleting client:', err);
        setError('Failed to delete client. Please try again.');
      }
    }
  };

  console.log('Rendering Clients component, clients:', clients);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Client Management</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
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