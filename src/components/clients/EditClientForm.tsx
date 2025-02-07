import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorFields from "./DoctorFields";
import { Client, ClientInput } from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface EditClientFormProps {
  client: Client | null;
  onSubmit: (data: ClientInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EditClientForm: React.FC<EditClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ClientInput | null>(null);

  useEffect(() => {
    if (client) {
      // Keep account_number in the form data but remove other server-side fields
      const { id, created_at, updated_at, ...clientData } = client;
      setFormData(clientData);
    }
  }, [client]);

  if (!formData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (!prev) return null;

      // Handle nested address fields
      if (name.startsWith('address.')) {
        const field = name.split('.')[1];
        return {
          ...prev,
          address: {
            ...prev.address,
            [field]: value
          }
        };
      }

      // Handle regular fields
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
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: (prev.doctors ?? []).map((doctor, i) =>
          i === index ? { ...doctor, [field]: value } : doctor
        ),
      };
    });
  };

  const addDoctor = () => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: [
          ...(prev.doctors ?? []), // Ensures `doctors` defaults to an empty array if undefined
          { name: "", phone: "", email: "", notes: "" },
        ],
      };
    });
  };

  const removeDoctor = (index: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        doctors: (prev.doctors ?? []).filter((_, i) => i !== index), // Default to empty array if `doctors` is undefined
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData) return;
      await onSubmit(formData);
      toast.success("Client updated successfully");
      // Navigate to client details page
      navigate(`/clients/${client?.id}`);
    } catch (error) {
      toast.error("Failed to update client");
      console.error("Error updating client:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Number Display */}
          <div className="space-y-2">
            <Label>Account Number</Label>
            <div className="relative">
              <Input
                value={client?.accountNumber || ""}
                disabled
                className="bg-muted"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Account number cannot be modified
            </p>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                name="status"
                value={formData.status || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  name="address.street"
                  value={formData.address?.street || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="address.city"
                  value={formData.address?.city || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="address.state"
                  value={formData.address?.state || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="address.zipCode"
                  value={formData.address?.zipCode || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Doctors Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Doctors</h3>
            {(formData?.doctors ?? []).map((doctor, index) => (
              <DoctorFields
                key={index}
                doctor={doctor}
                onChange={(field, value) =>
                  handleDoctorChange(index, field as keyof Doctor, value)
                }
                onRemove={() => removeDoctor(index)}
                showRemove={
                  formData?.doctors ? formData?.doctors?.length > 1 : false
                }
              />
            ))}

            <Button
              type="button"
              onClick={addDoctor}
              variant="secondary"
            >
              Add Another Doctor
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Client...
                </>
              ) : (
                "Update Client"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EditClientForm;
