import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Client,
    ClientInput,
    clientsService,
} from "../../services/clientsService";
import { toast } from "react-hot-toast";
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
    client: Client | null; // Prop passed, but we'll manage it in state
    onEdit: (clientData: ClientInput) => void;
    onDelete: () => void;
    loading: boolean;
    error: string | null;
}

const ClientProfile: React.FC<ClientDetailsProps> = ({
    client: initialClient,
    onEdit,
    onDelete,
    loading,
    error,
}) => {
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(initialClient); // Manage client in state
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<ClientInput | null>(null);
    const [activeTab, setActiveTab] = useState("client-information");
    const [lab, setLab] = useState<{ labId: string; name: string } | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const loadClient = async () => {
            try {
                if (!user) {
                    toast.error("User data not found");
                    return;
                }

                // Fetch lab data
                const labData = await getLabIdByUserId(user.id);
                if (!labData) {
                    toast.error("Unable to get Lab ID");
                    return;
                }
                setLab(labData);

                // Fetch client ID based on the user's email
                const fetchedClientID = await clientsService.getClientIdByUserEmail(user.email);
                if (!fetchedClientID) {
                    toast.error("Client ID not found");
                    return;
                }

                // Fetch client data using the client ID
                const fetchedClient = await clientsService.getClient(fetchedClientID);
                if (!fetchedClient) {
                    toast.error("Client data not found");
                    return;
                }

                // Set the client data in state
                setClient(fetchedClient);
                setEditedData(fetchedClient); // Initialize editable data
            } catch (error) {
                console.error("Error loading client data:", error);
                toast.error("Failed to load client data.");
            }
        };

        loadClient();
    }, [user?.id, user?.email]); // Depend on user ID and email

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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="mb-6 space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                    {client.clientName}
                </h2>
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
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "client-information"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Client Information
                    </button>
                    {/* <button
                        onClick={() => setActiveTab("case-activity")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "case-activity"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Case Activity
                    </button>
                    <button
                        onClick={() => setActiveTab("billing")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "billing"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Billing
                    </button>
                    <button
                        onClick={() => setActiveTab("sales-activity")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "sales-activity"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Sales Activity
                    </button> */}
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

export default ClientProfile;
