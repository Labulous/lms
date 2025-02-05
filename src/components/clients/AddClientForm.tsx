import React, { useState, useEffect } from "react";
import DoctorFields from "./DoctorFields";
import { ClientInput } from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { getLabIdByUserId } from "../../services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface AddClientFormProps {
  onSubmit: (data: ClientInput) => void;
  onCancel: () => void;
  loading?: boolean;
  onSuccess?: () => void;
}

const AddClientForm: React.FC<AddClientFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  onSuccess,
}) => {
  const [nextAccountNumber, setNextAccountNumber] = useState<string>("");
  const [formData, setFormData] = useState<ClientInput>({
    clientName: "",
    contactName: "",
    phone: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    clinicRegistrationNumber: "",
    notes: "",
    doctors: [{ name: "", phone: "", email: "", notes: "" }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNextAccountNumber = async () => {
      try {
        console.log("Fetching next account number...");
        const { data, error } = await supabase.rpc(
          "get_next_account_number",
          {},
          {
            count: "exact",
          }
        );

        console.log("Fetch response:", { data, error });

        if (error) {
          console.error("Error fetching next account number:", error);
          return;
        }

        if (data) {
          console.log("Setting account number to:", data);
          setNextAccountNumber(data as string);
        } else {
          console.warn("No account number received");
          setNextAccountNumber("1001"); // Default fallback
        }
      } catch (err) {
        console.error("Error in fetchNextAccountNumber:", err);
        setNextAccountNumber("1001"); // Default fallback
      }
    };

    fetchNextAccountNumber();
  }, []);

  console.log("Rendering with account number:", nextAccountNumber);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDoctorChange = (
    index: number,
    field: keyof Doctor,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      doctors: (prev?.doctors ?? []).map((doctor, i) =>
        i === index ? { ...doctor, [field]: value } : doctor
      ),
    }));
  };

  const addDoctor = () => {
    setFormData((prev) => ({
      ...prev,
      doctors: [
        ...(prev?.doctors ?? []),
        { name: "", phone: "", email: "", notes: "" },
      ],
    }));
  };

  const removeDoctor = (index: number) => {
    if ((formData?.doctors?.length ?? 0) === 1) {
      toast.error("At least one doctor is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      doctors: (prev?.doctors ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Get lab_id for the current user
      const labData = await getLabIdByUserId(user.id);
      if (!labData) {
        throw new Error("No lab found for current user");
      }

      const { data: accountNumber, error: numberError } = await supabase.rpc(
        "get_next_account_number"
      );
      if (numberError) throw numberError;

      const result = await onSubmit({
        ...formData,
        account_number: accountNumber as string,
        lab_id: labData.labId, // Add lab_id to the client data
      });

      if (result !== undefined) {
        toast.success("Client added successfully!");
        setFormData({
          clientName: "",
          contactName: "",
          phone: "",
          email: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
          },
          clinicRegistrationNumber: "",
          notes: "",
          doctors: [{ name: "", phone: "", email: "", notes: "" }],
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Add New Client
            {nextAccountNumber && (
              <span className="ml-2 text-muted-foreground">
                – Account #{nextAccountNumber}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street *</Label>
                <Input
                  id="street"
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicRegistrationNumber">Clinic Registration Number</Label>
              <Input
                id="clinicRegistrationNumber"
                type="text"
                name="clinicRegistrationNumber"
                value={formData.clinicRegistrationNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>

          {/* Doctors Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Doctors</h3>
            {(formData?.doctors ?? []).map((doctor, index) => (
              <DoctorFields
                key={index}
                doctor={doctor}
                onChange={(field, value) => handleDoctorChange(index, field, value)}
                onRemove={() => removeDoctor(index)}
                showRemove={(formData?.doctors?.length ?? 0) > 1}
              />
            ))}

            <Button
              type="button"
              onClick={addDoctor}
              variant="secondary"
              className="mt-2"
            >
              Add Another Doctor
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default AddClientForm;
