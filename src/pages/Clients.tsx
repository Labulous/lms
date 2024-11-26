import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Outlet } from 'react-router-dom';
import ClientList from '../components/clients/ClientList';
import ClientDetails from '../components/clients/ClientDetails';
import AddClientForm from '../components/clients/AddClientForm';
import EditClientForm from '../components/clients/EditClientForm';
import { Client, ClientInput, clientsService } from '../services/clientsService';
import { createLogger } from '../utils/logger';
import ErrorBoundary from '../components/ErrorBoundary';

const logger = createLogger({ module: 'ClientsPage' });

const Clients: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const navigate = useNavigate();

  // Debug logging for component render
  console.log('DEBUG: Clients component rendering', {
    clientId,
    hasSelectedClient: !!selectedClient,
    loading,
    error,
    path: window.location.pathname
  });

  // Effect for loading client details
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        console.log('DEBUG: No client ID, clearing selected client');
        setSelectedClient(null);
        setLoading(false);
        return;
      }

      console.log('DEBUG: Fetching client data for ID:', clientId);
      
      try {
        setLoading(true);
        setError(null);
        
        const clientData = await clientsService.getClientById(clientId);
        console.log('DEBUG: Client data fetched:', clientData);
        
        if (clientData) {
          setSelectedClient(clientData);
        } else {
          console.log('DEBUG: No client data found for ID:', clientId);
          setError('Client not found');
          setSelectedClient(null);
        }
      } catch (err: any) {
        console.error('DEBUG: Error fetching client:', err);
        setError(err.message || 'Failed to load client details');
        setSelectedClient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Effect for loading clients list
  useEffect(() => {
    const loadClients = async () => {
      if (!clientId) {
        try {
          console.log('DEBUG: Loading clients list');
          setLoading(true);
          setError(null);
          const allClients = await clientsService.getClients();
          setClients(allClients);
        } catch (err: any) {
          console.error('DEBUG: Error loading clients:', err);
          setError(err.message || 'Failed to load clients');
        } finally {
          setLoading(false);
        }
      }
    };

    loadClients();
  }, [clientId]);

  const handleAddClient = async (clientData: ClientInput) => {
    try {
      setLoading(true);
      setError(null);
      await clientsService.addClient(clientData);
      await loadClients();
      navigate('/clients');
    } catch (err: any) {
      setError(err.message || 'Failed to add client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (id: string, clientData: ClientInput) => {
    try {
      setLoading(true);
      setError(null);
      await clientsService.updateClient(id, clientData);
      await loadClients();
      navigate(`/clients/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await clientsService.deleteClient(id);
      await loadClients();
      navigate('/clients');
    } catch (err: any) {
      setError(err.message || 'Failed to delete client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ClientDetailsWrapper: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchClientData = async () => {
        if (!clientId) {
          setLoading(false);
          return;
        }

        try {
          console.log('DEBUG: Fetching client details for ID:', clientId);
          setLoading(true);
          setError(null);
          
          const clientData = await clientsService.getClientById(clientId);
          console.log('DEBUG: Client data fetched:', clientData);
          
          if (clientData) {
            setClient(clientData);
          } else {
            setError('Client not found');
          }
        } catch (err: any) {
          console.error('DEBUG: Error fetching client:', err);
          setError(err.message || 'Failed to load client details');
        } finally {
          setLoading(false);
        }
      };

      fetchClientData();
    }, [clientId]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => navigate('/clients')}
                className="mt-2 text-sm text-red-700 underline hover:text-red-900"
              >
                Return to Clients List
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!client) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No client data available</div>
          <button
            onClick={() => navigate('/clients')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Clients List
          </button>
        </div>
      );
    }

    return (
      <ClientDetails
        client={client}
        onEdit={() => navigate(`/clients/${clientId}/edit`)}
        onDelete={() => handleDeleteClient(clientId)}
        loading={loading}
        error={error}
      />
    );
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            index
            element={
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Clients</h1>
                  <button
                    onClick={() => navigate('new')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Add Client
                  </button>
                </div>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <ClientList
                  clients={clients}
                  loading={loading}
                  onDeleteClient={handleDeleteClient}
                />
              </>
            }
          />
          <Route
            path="new"
            element={<AddClientForm onSubmit={handleAddClient} onCancel={() => navigate('/clients')} />}
          />
          <Route
            path=":clientId"
            element={<ClientDetailsWrapper />}
          />
          <Route
            path=":clientId/edit"
            element={
              <EditClientForm
                onSubmit={(data) => handleUpdateClient(clientId!, data)}
                onCancel={() => navigate(`/clients/${clientId}`)}
              />
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default Clients;