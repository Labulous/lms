import React, { Dispatch, SetStateAction } from "react";
import {
  Client,
  ClientInput,
  Doctor,
} from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import { cn } from "@/lib/utils";

interface ClientAccountInfoProps {
  client: Client;
  isEditing: boolean;
  editedData: ClientInput | null;
  setEditedData: Dispatch<SetStateAction<ClientInput | null>>;
  onEdit: (clientData: ClientInput) => void;
  onDelete: () => void;
  setIsEditing: (isEditing: boolean) => void;
}

const ClientAccountInfo: React.FC<ClientAccountInfoProps> = ({
  client,
  isEditing,
  editedData,
  setEditedData,
  onEdit,
  onDelete,
  setIsEditing,
}) => {
  const handleEditClick = () => {
    // Initialize editedData with all current client data
    setEditedData({
      accountNumber: client.accountNumber,
      clientName: client.clientName,
      contactName: client.contactName,
      phone: client.phone,
      email: client.email,
      address: {
        street: client.address.street,
        city: client.address.city,
        state: client.address.state,
        zipCode: client.address.zipCode,
      },
      clinicRegistrationNumber: client.clinicRegistrationNumber,
      notes: client.notes ?? "",
      doctors: client.doctors.map(doctor => ({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        notes: doctor.notes ?? "",
      })),
    });
    setIsEditing(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEditedData((prev: ClientInput | null) => {
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

  const handleDoctorChange = (
    index: number,
    field: keyof Doctor,
    value: string
  ) => {
    setEditedData((prev) => {
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

  const addDoctor = () => {
    setEditedData((prev) => {
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
    setEditedData((prev) => {
      if (!prev) return null;
      const updatedDoctors = [...(prev.doctors || [])];
      updatedDoctors.splice(index, 1);
      return {
        ...prev,
        doctors: updatedDoctors,
      };
    });
  };

  const handleSave = async () => {
    if (!editedData) return;

    try {
      await onEdit(editedData);
      setIsEditing(false);
      toast.success("Client details updated successfully");
    } catch (error) {
      toast.error("Failed to update client details");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">
              Account Details
            </CardTitle>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline">
                      Last Updated: {client.updated_at ? format(new Date(client.updated_at), "PPp") : "N/A"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Created: {client.created_at ? format(new Date(client.created_at), "PPp") : "N/A"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
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
                      value={isEditing ? editedData?.email ?? "" : client.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
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
                  {(isEditing ? editedData?.doctors : client.doctors)?.map(
                    (doctor, index) => (
                      <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                          <CardTitle className="text-base">
                            Doctor #{index + 1}
                          </CardTitle>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDoctor(index)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={doctor.name}
                              onChange={(e) =>
                                handleDoctorChange(index, "name", e.target.value)
                              }
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={doctor.email}
                              onChange={(e) =>
                                handleDoctorChange(index, "email", e.target.value)
                              }
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              type="tel"
                              value={doctor.phone}
                              onChange={(e) =>
                                handleDoctorChange(index, "phone", e.target.value)
                              }
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                              value={doctor.notes ?? ""}
                              onChange={(e) =>
                                handleDoctorChange(index, "notes", e.target.value)
                              }
                              disabled={!isEditing}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAccountInfo;
