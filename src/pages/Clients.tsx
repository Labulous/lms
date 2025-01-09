import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import ClientList from "../components/clients/ClientList";
import ClientDetails from "../components/clients/ClientDetails";
import AddClientForm from "../components/clients/AddClientForm";
import EditClientForm from "../components/clients/EditClientForm";
import {
  Client,
  ClientInput,
  clientsService,
} from "../services/clientsService";
import { createLogger } from "../utils/logger";
import ErrorBoundary from "../components/ErrorBoundary";
import { toast } from "react-hot-toast";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

const logger = createLogger({ module: "ClientsPage" });

const Clients: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();

  const [, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fetchClients = async () => {
    try {
      logger.debug("Fetching clients");
      setLoading(true);
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData) {
        toast.error("Unable to get Lab Id");
        return null;
      }
      setLab(labData);
      const data = await clientsService.getClients(labData.labId);
      setClients(data);
      setError(null);
    } catch (err: any) {
      logger.error("Error fetching clients:", err);
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (data: ClientInput) => {
    try {
      await clientsService.addClient(data);
      await fetchClients(); // Refresh the list
      navigate("/clients");
      toast.success("Client added successfully");
    } catch (err: any) {
      logger.error("Error adding client:", err);
      toast.error(err.message || "Failed to add client");
    }
  };

  const handleUpdateClient = async (clientId: string, data: ClientInput) => {
    try {
      await clientsService.updateClient(clientId, data);
      await fetchClients(); // Refresh the list
      toast.success("Client updated successfully");
    } catch (err: any) {
      logger.error("Error updating client:", err);
      toast.error(err.message || "Failed to update client");
      throw err;
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      await clientsService.deleteClient(clientId);
      await fetchClients(); // Refresh the list
      navigate("/clients");
      toast.success("Client deleted successfully");
    } catch (err: any) {
      logger.error("Error deleting client:", err);
      toast.error(err.message || "Failed to delete client");
    }
  };

  const ClientDetailsWrapper: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);

    useEffect(() => {
      const fetchClientData = async () => {
        if (!clientId) {
          setLoading(false);
          return;
        }

        try {
          logger.debug("Fetching client details for ID:", clientId);
          setLoading(true);
          setError(null);

          const clientData = await clientsService.getClientById(clientId);
          logger.debug("Client data fetched:", clientData);

          if (clientData) {
            setClient(clientData);
          } else {
            setError("Client not found");
          }
        } catch (err: any) {
          logger.error("Error fetching client:", err);
          setError(err.message || "Failed to load client details");
        } finally {
          setLoading(false);
        }
      };

      fetchClientData();
    }, [clientId]);

    const handleClientUpdate = async (data: ClientInput) => {
      if (!clientId) return;

      try {
        await handleUpdateClient(clientId, data);
        // Refresh client details
        const updatedClient = await clientsService.getClientById(clientId);
        setClient(updatedClient);
      } catch (error) {
        // Error is already handled in handleUpdateClient
        throw error;
      }
    };

    return (
      <ClientDetails
        client={client}
        onEdit={handleClientUpdate}
        onDelete={() => handleDeleteClient(clientId!)}
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
              <ClientList
                clients={clients}
                loading={loading}
                onDeleteClient={handleDeleteClient}
              />
            }
          />
          <Route
            path="new"
            element={
              <AddClientForm
                onSubmit={handleAddClient}
                onCancel={() => navigate("/clients")}
              />
            }
          />
          <Route path=":clientId" element={<ClientDetailsWrapper />} />
          <Route
            path=":clientId/edit"
            element={
              <EditClientForm
                onSubmit={(data) => handleUpdateClient(clientId!, data)}
                onCancel={() => navigate(`/clients/${clientId}`)}
                client={null}
              />
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default Clients;
