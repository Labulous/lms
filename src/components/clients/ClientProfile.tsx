import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Client, clientsService } from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Pencil,
    Trash2,
    Save,
    X,
    UserPlus,
    UserMinus,
    Phone,
    Mail,
    Building,
    MapPin,
    User,
    FileText,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ClientCaseActivity } from "./ClientCaseActivity";
import { ClientBillingActivity } from "./ClientBillingActivity";
import ClientSalesActivity from "./ClientSalesActivity";

type Doctor = {
    id?: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
};

const ClientProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({});
    const [activeTab, setActiveTab] = useState("client-information");

    useEffect(() => {
        const loadClient = async () => {
            try {
                if (!user) {
                    toast.error("User not found");
                    return;
                }

                const fetchedClientID = await clientsService.getClientIdByUserEmail(user.email);
                if (!fetchedClientID) {
                    toast.error("Client ID not found");
                    return;
                }

                const fetchedClient = await clientsService.getClient(fetchedClientID);
                if (!fetchedClient) {
                    toast.error("Client data not found");
                    return;
                }

                setClient(fetchedClient);
                setEditedData(fetchedClient); // Initialize edited data
            } catch (error) {
                console.error("Error loading client data:", error);
                toast.error("Failed to load client data.");
            }
        };

        loadClient();
    }, [user?.email]);

    const handleEditClick = () => setIsEditing(true);

    const handleSave = async () => {
        if (!editedData || !client) return;
        try {
            if (!user) {
                toast.error("User not found");
                return;
            }
            // Fetch client ID again before saving
            const fetchedClientID = await clientsService.getClientIdByUserEmail(user.email);
            if (!fetchedClientID) {
                toast.error("Client ID not found");
                return;
            }

            // Call API to save edited data using the fetched client ID
            await clientsService.updateClientUserDetails(fetchedClientID, editedData); // Pass fetchedClientID instead of client?.id
            toast.success("Client data saved successfully");
            setIsEditing(false);
            setClient(editedData); // Update the client with the saved data
        } catch (error) {
            console.error("Failed to save client data:", error);
            toast.error("Failed to save client data.");
        }
    };

    if (!client) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }



    const handleCancel = () => {
        setIsEditing(false);
        setEditedData(null);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setEditedData((prev: Client | null) => {
            if (!prev) return null; // If prev is null, return null

            // If the input field is related to "address", handle it separately
            if (name.startsWith("address.")) {
                const addressField = name.split(".")[1]; // Extract the specific address field
                return {
                    ...prev,
                    address: {
                        ...prev.address,
                        [addressField]: value, // Dynamically update the address field
                    },
                };
            }

            // For other fields, update them directly
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    console.log(client);

    const addDoctor = () => {
        setEditedData((prev: Client | null) => {
            if (!prev) return null;
            return {
                ...prev,
                doctors: [
                    ...(prev.doctors || []),
                    { name: "", email: "", phone: "", notes: "" },
                ],
            };
        });
    };

    const removeDoctor = (index: number) => {
        setEditedData((prev: Client | null) => {
            if (!prev) return null;
            const updatedDoctors = [...(prev.doctors || [])];
            updatedDoctors.splice(index, 1);
            return {
                ...prev,
                doctors: updatedDoctors,
            };
        });
    };

    const handleDoctorChange = (
        index: number,
        field: keyof Doctor,
        value: string
    ) => {
        setEditedData((prev: Client | null) => {
            if (!prev) return null;
            const updatedDoctors = [...(prev.doctors || [])];
            if (!updatedDoctors[index]) {
                updatedDoctors[index] = { name: "", email: "", phone: "", notes: "" };
            }
            updatedDoctors[index] = { ...updatedDoctors[index], [field]: value };
            return {
                ...prev,
                doctors: updatedDoctors,
            };
        });
    };


    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="mb-6 space-y-2">
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 hover:text-gray-600 focus:outline-none">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {client.clientName}
                        </h2>
                        {/* <ChevronDown className="h-5 w-5 text-gray-500" /> */}
                    </DropdownMenuTrigger>
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
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "client-information"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Client Information
                    </button>
                    <button
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
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "client-information" && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-semibold">
                                        Account Details
                                    </CardTitle>
                                </div>
                                <div className="space-x-2">
                                    {!isEditing ? (
                                        <>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleEditClick}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={handleSave}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Save
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCancel}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Basic Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Account Number</Label>
                                                <Input
                                                    value={client.accountNumber}
                                                    disabled
                                                    className="bg-muted"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Client Name</Label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="clientName"
                                                        value={isEditing ? editedData?.clientName ?? "" : client.clientName}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Contact Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="contactName"
                                                        value={isEditing ? editedData?.contactName ?? "" : client.contactName}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Phone</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="phone"
                                                        value={isEditing ? editedData?.phone ?? "" : client.phone}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="email"
                                                        //value={isEditing ? editedData?.email ?? "" : client.email}
                                                        //onChange={handleInputChange}
                                                        //disabled={!isEditing}
                                                        value={client.email}
                                                        disabled
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Address</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Street</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="address.street"
                                                        value={isEditing ? editedData?.address?.street ?? "" : client.address.street}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">City</Label>
                                                <Input
                                                    name="address.city"
                                                    value={isEditing ? editedData?.address?.city ?? "" : client.address.city}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">State</Label>
                                                <Input
                                                    name="address.state"
                                                    value={isEditing ? editedData?.address?.state ?? "" : client.address.state}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Zip Code</Label>
                                                <Input
                                                    name="address.zipCode"
                                                    value={isEditing ? editedData?.address?.zipCode ?? "" : client.address.zipCode}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Additional Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Clinic Registration Number</Label>
                                            <Input
                                                name="clinicRegistrationNumber"
                                                value={isEditing ? editedData?.clinicRegistrationNumber ?? "" : client.clinicRegistrationNumber}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Notes</Label>
                                            <Textarea
                                                name="notes"
                                                value={isEditing ? editedData?.notes ?? "" : client.notes ?? ""}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-6">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-lg">Doctors</CardTitle>
                                        {isEditing && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={addDoctor}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Add Doctor
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {!client.doctors || client.doctors.length === 0 ? (
                                            <div className="text-muted-foreground text-center py-4">
                                                No doctors assigned
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {Array.isArray(isEditing ? editedData?.doctors : client.doctors) &&
                                                    (isEditing ? editedData?.doctors : client.doctors).map((doctor: Doctor, index: number) => (
                                                        <Card key={index}>
                                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                                                                <CardTitle className="text-base">Doctor #{index + 1}</CardTitle>
                                                                {isEditing && (
                                                                    <Button variant="ghost" size="sm" onClick={() => removeDoctor(index)}>
                                                                        <UserMinus className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </CardHeader>
                                                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>Name</Label>
                                                                    <Input
                                                                        value={doctor.name}
                                                                        onChange={(e) => handleDoctorChange(index, "name", e.target.value)}
                                                                        disabled={!isEditing}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Email</Label>
                                                                    <Input
                                                                        type="email"
                                                                        value={doctor.email}
                                                                        onChange={(e) => handleDoctorChange(index, "email", e.target.value)}
                                                                        disabled={!isEditing}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Phone</Label>
                                                                    <Input
                                                                        type="tel"
                                                                        value={doctor.phone}
                                                                        onChange={(e) => handleDoctorChange(index, "phone", e.target.value)}
                                                                        disabled={!isEditing}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Notes</Label>
                                                                    <Input
                                                                        value={doctor.notes ?? ""}
                                                                        onChange={(e) => handleDoctorChange(index, "notes", e.target.value)}
                                                                        disabled={!isEditing}
                                                                    />
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}

                                            </div>
                                        )}
                                    </CardContent>
                                </Card >
                            </CardContent >
                        </Card >
                    </div >
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
        </div >
    );
};

export default ClientProfile;
