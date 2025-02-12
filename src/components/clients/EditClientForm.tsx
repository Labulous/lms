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
import { Textarea } from "../ui/textarea";

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
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  const [otherEmailInputs, setOtherEmailInputs] = useState([1]);

  useEffect(() => {
    if (client) {
      // Keep account_number in the form data but remove other server-side fields
      const { id, created_at, updated_at, ...clientData } = client;
      setFormData({
        accountNumber: clientData.accountNumber,
        clientName: clientData.clientName,
        contactName: clientData.contactName,
        phone: clientData.phone,
        additionalPhone: clientData.additionalPhone,
        email: clientData.email,
        billingEmail: clientData.billingEmail,
        otherEmail: clientData.otherEmail,
        address: {
          street: clientData.address.street,
          city: clientData.address.city,
          state: clientData.address.state,
          zipCode: clientData.address.zipCode,
          country: clientData.address.country,
        },
        billingAddress: {
          street: clientData.billingAddress.street,
          city: clientData.billingAddress.city,
          state: clientData.billingAddress.state,
          zipCode: clientData.billingAddress.zipCode,
          country: clientData.billingAddress.country,
        },
        clinicRegistrationNumber: clientData.clinicRegistrationNumber,
        taxRate: clientData.taxRate,
        salesRepName: clientData.salesRepName,
        additionalLeadTime: clientData.additionalLeadTime,
        salesRepNote: clientData.salesRepNote,
        notes: clientData.notes ?? "",
        doctors: clientData.doctors.map((doctor) => ({
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          notes: doctor.notes ?? "",
        })),
      });
    }
    setOtherEmailInputs(
      client?.otherEmail?.map((_item, idex) => idex + 1) || [1]
    );
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
    console.log(name,"name")
    setFormData((prev) => {
      if (!prev) return null;

      // Handle nested address fields
      if (name.startsWith("address.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          address: {
            ...prev.address,
            [field]: value,
          },
        };
      }
      if (name.startsWith("billingAddress.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          billingAddress: {
            ...prev.billingAddress,
            [field]: value,
          },
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
      // navigate(`/clients/${client?.id}`);
    } catch (error) {
      toast.error("Failed to update client");
      console.error("Error updating client:", error);
    }
  };
  const handleSameAsDeliveryChange = (checked: boolean) => {
    setSameAsDelivery(checked);
    if (checked) {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          billingAddress: {
            street: prev.billingAddress?.street || "",
            city: prev.billingAddress?.city || "",
            state: prev.billingAddress?.state || "",
            zipCode: prev.billingAddress?.zipCode || "",
            country: prev.billingAddress?.country || "",
          },
        };
      });
    }
  };
  const handleOtherEmail = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!Array.isArray(formData.otherEmail)) return;
    const newOtherEmails = [...formData.otherEmail];
    newOtherEmails[index] = event.target.value;
    setFormData({ ...formData, otherEmail: newOtherEmails });
  };

  const addOtherEmail = () => {
    setOtherEmailInputs([...otherEmailInputs, otherEmailInputs.length + 1]);
  };

  const removeOtherEmail = (index: number) => {
    if (!Array.isArray(formData.otherEmail)) return;
    const newOtherEmails = formData.otherEmail.filter((_, i) => i !== index);
    setFormData({ ...formData, otherEmail: newOtherEmails });
    setOtherEmailInputs(otherEmailInputs.slice(0, -1));
  };
  console.log(sameAsDelivery, "sameAsDelivery");
  console.log(formData, "Formdata");
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
                value={formData?.accountNumber || ""}
                type="tel"
                name="accountNumber"
                className=""
                onChange={handleInputChange}
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
            {/* <p className="text-sm text-muted-foreground">
              Account number cannot be modified
            </p> */}
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client/Practice Name*</Label>
              <Input
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Primary Phone*</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="additionalPhone">Additional Phone</Label>
                <Input
                  id="additionalPhone"
                  name="additionalPhone"
                  value={formData.additionalPhone}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="billingEmail">Billing Email*</Label>
                <Input
                  id="billingEmail"
                  name="billingEmail"
                  type="email"
                  value={formData.billingEmail}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="otherEmail">Other Email</Label>
                <Input
                  id="otherEmail"
                  name="otherEmail"
                  type="email"
                  value={formData.otherEmail}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Primary Phone*</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="additionalPhone">Additional Phone</Label>
                  <Input
                    id="additionalPhone"
                    name="additionalPhone"
                    value={formData.additionalPhone}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billingEmail">Billing Email*</Label>
                  <Input
                    id="billingEmail"
                    name="billingEmail"
                    type="email"
                    required
                    value={formData.billingEmail}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                {otherEmailInputs.map((_, index) => (
                  <div
                    key={index}
                    className="mt-2 flex flex-col items-center gap-2"
                  >
                    <Label htmlFor={`otherEmail-${index}`}>
                      Other Email {index + 1}
                    </Label>
                    <div className="flex justify-center gap-1 items-center">
                      <Input
                        id={`otherEmail-${index}`}
                        name={`otherEmail-${index}`}
                        type="email"
                        value={formData?.otherEmail?.[index] || ""}
                        onChange={(e) => handleOtherEmail(index, e)}
                        className="mt-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOtherEmail(index)}
                        className="border  px-2 py-1  rounded"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col mt-2">
                  <Label htmlFor={`otherEmail-`}>Other Email</Label>
                  <button
                    type="button"
                    onClick={addOtherEmail}
                    className="mt-2 bg-blue-500 text-white px-2 py-2 rounded"
                  >
                    Add Other Email
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Additional Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="additionalLeadTime">
                  Additional Lead Time (Days)
                </Label>
                <Input
                  id="additionalLeadTime"
                  name="additionalLeadTime"
                  type="number"
                  min="0"
                  value={formData.additionalLeadTime}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="salesRepName">Sales Representative</Label>
                <Input
                  id="salesRepName"
                  name="salesRepName"
                  value={formData.salesRepName}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="clinicRegistrationNumber">
                  Clinic Registration Number
                </Label>
                <Input
                  id="clinicRegistrationNumber"
                  name="clinicRegistrationNumber"
                  value={formData.clinicRegistrationNumber}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salesRepNote">Sales Rep Notes</Label>
                <Textarea
                  id="salesRepNote"
                  name="salesRepNote"
                  value={formData.salesRepNote}
                  onChange={handleInputChange}
                  className="mt-1 h-24"
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 h-24"
                />
              </div>
            </div>
          </div>
          {/* Address Information */}
          <div className="flex gap-5">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    name="address.street"
                    value={formData.address?.street || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="address.city"
                    value={formData.address?.city || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="address.state"
                    value={formData.address?.state || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    name="address.zipCode"
                    value={formData.address?.zipCode || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Billing Address
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAsDelivery"
                    checked={sameAsDelivery}
                    onChange={(e) =>
                      handleSameAsDeliveryChange(e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="sameAsDelivery" className="text-sm">
                    Same as Primary
                  </Label>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="billingAddress.street">Street</Label>
                  <Input
                    id="billingAddress.street"
                    name="billingAddress.street"
                    value={
                      sameAsDelivery
                        ? formData.address.street
                        : formData.billingAddress?.street
                    }
                    onChange={handleInputChange}
                    disabled={sameAsDelivery}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="billingAddress.city">City</Label>
                    <Input
                      id="billingAddress.city"
                      name="billingAddress.city"
                      value={
                        sameAsDelivery
                          ? formData.address.city
                          : formData.billingAddress?.city
                      }
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingAddress.state">State</Label>
                    <Input
                      id="billingAddress.state"
                      name="billingAddress.state"
                      value={
                        sameAsDelivery
                          ? formData.address.state
                          : formData.billingAddress?.state
                      }
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div>
                    <Label htmlFor="billingAddress.zipCode">Zip Code</Label>
                    <Input
                      id="billingAddress.zipCode"
                      name="billingAddress.zipCode"
                      value={
                        sameAsDelivery
                          ? formData.address.zipCode
                          : formData.billingAddress?.zipCode
                      }
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>{" "}
                  <div>
                    <Label htmlFor="billingAddress.zipCode">Country</Label>
                    <Input
                      id="billingAddress.country"
                      name="billingAddress.country"
                      value={
                        sameAsDelivery
                          ? formData.address.country
                          : formData.billingAddress?.country
                      }
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>
                </div>
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

            <Button type="button" onClick={addDoctor} variant="secondary">
              Add Another Doctor
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
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
