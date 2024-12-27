import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, ClientInput, clientsService } from '../../services/clientsService';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import ClientAccountInfo from './ClientAccountInfo';

interface ClientDetailsProps {
  client: Client | null;
  onEdit: (clientData: ClientInput) => void;
  onDelete: () => void;
  loading: boolean;
  error: string | null;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onDelete, loading, error }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ClientInput | null>(null);
  const [activeTab, setActiveTab] = useState("client-information");
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const allClients = await clientsService.getClients();
        console.log('Loaded clients:', allClients);
        setClients(allClients);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Failed to load clients list');
      }
    };
    loadClients();
  }, []);

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
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-6 space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:text-gray-600 focus:outline-none">
            <h2 className="text-2xl font-bold text-gray-900">{client.clientName}</h2>
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            {clients.length === 0 ? (
              <DropdownMenuItem disabled>No clients found</DropdownMenuItem>
            ) : (
              clients.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="cursor-pointer"
                >
                  {c.clientName}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-baseline gap-4">
          <span className="text-sm text-gray-500">Account #{client.accountNumber}</span>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="client-information" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="client-information">Client Information</TabsTrigger>
          <TabsTrigger value="case-information">Case Activity</TabsTrigger>
          <TabsTrigger value="invoice">Billing</TabsTrigger>
          <TabsTrigger value="sales-activity">Sales Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="client-information">
          <ClientAccountInfo
            client={client}
            isEditing={isEditing}
            editedData={editedData}
            setEditedData={setEditedData}
            onEdit={onEdit}
            onDelete={onDelete}
            setIsEditing={setIsEditing}
          />
        </TabsContent>

        <TabsContent value="case-information">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Case Information</h2>
            <p className="text-gray-500">Case information content coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="invoice">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Invoice</h2>
            <p className="text-gray-500">Invoice content coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="sales-activity">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Sales Activity</h2>
            <p className="text-gray-500">Sales activity content coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetails;