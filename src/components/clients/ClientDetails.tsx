import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Client,
  ClientInput,
  clientsService,
} from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import ClientAccountInfo from "./ClientAccountInfo";
import ClientSalesActivity from "./ClientSalesActivity";
import { ClientCaseActivity } from "./ClientCaseActivity";
import { ClientBillingActivity } from "./ClientBillingActivity";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

interface ClientDetailsProps {
  client: Client | null;
  onEdit: (clientData: ClientInput) => void;
  onDelete: () => void;
  loading: boolean;
  error: string | null;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  onEdit,
  onDelete,
  loading,
  error,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ClientInput | null>(null);
  const [activeTab, setActiveTab] = useState("client-information");
  const [clients, setClients] = useState<Client[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();

  const { user } = useAuth();
  useEffect(() => {
    const loadClients = async () => {
      try {
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return null;
        }
        setLab(labData);
        const allClients = await clientsService.getClients(labData.labId);
        console.log("Loaded clients:", allClients);
        setClients(allClients);
      } catch (error) {
        console.error("Error loading clients:", error);
        toast.error("Failed to load clients list");
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
          onClick={() => navigate("/clients")}
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
        <div className="text-gray-500">
          No client data available. Please try again.
        </div>
        <button
          onClick={() => navigate("/clients")}
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
            <h2 className="text-2xl font-bold text-gray-900">
              {client.clientName}
            </h2>
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
          <span className="text-sm text-gray-500">
            Account #{client.accountNumber}
          </span>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("client-information")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "client-information"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Client Information
          </button>
          <button
            onClick={() => setActiveTab("case-activity")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "case-activity"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Case Activity
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "billing"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab("sales-activity")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "sales-activity"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Sales Activity
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "client-information" && (
          <ClientAccountInfo
            client={client}
            onEdit={onEdit}
            onDelete={onDelete}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editedData={editedData}
            setEditedData={setEditedData}
          />
        )}
        {activeTab === "case-activity" && (
          <ClientCaseActivity clientId={client.id} />
        )}
        {activeTab === "billing" && (
          <ClientBillingActivity clientId={client.id} />
        )}
        {activeTab === "sales-activity" && (
          <ClientSalesActivity clientId={client.id} />
        )}
      </div>
    </div>
  );
};

export default ClientDetails;
