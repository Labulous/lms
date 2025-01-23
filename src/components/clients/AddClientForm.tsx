import React, { useState, useEffect } from "react";
import DoctorFields from "./DoctorFields";
import { ClientInput } from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";

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

  //Get UserID 
  const { user } = useAuth();
  const [labId, setLabId] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        // Get LabID
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return;
        }
        setLabId(labData.labId);  // Set the lab ID here
      } catch (error) {
        console.error("Error loading clients:", error);
        toast.error("Failed to load clients list");
      }
    };
    loadClients();
  }, [user]);

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

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  //   try {
  //     const { data: accountNumber, error: numberError } = await supabase.rpc(
  //       "get_next_account_number"
  //     );
  //     if (numberError) throw numberError;

  //     const result = await onSubmit({
  //       ...formData,
  //       account_number: accountNumber as string,
  //     });

  //     if (result !== undefined) {
  //       toast.success("Client added successfully!");
  //       setFormData({
  //         clientName: "",
  //         contactName: "",
  //         phone: "",
  //         email: "",
  //         address: {
  //           street: "",
  //           city: "",
  //           state: "",
  //           zipCode: "",
  //         },
  //         clinicRegistrationNumber: "",
  //         notes: "",
  //         doctors: [{ name: "", phone: "", email: "", notes: "" }],
  //       });
  //       onSuccess?.();
  //     }
  //   } catch (error) {
  //     console.error("Error adding client:", error);
  //     toast.error("Failed to add client. Please try again.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!labId) {
      toast.error("Lab ID is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: accountNumber, error: numberError } = await supabase.rpc(
        "get_next_account_number"
      );
      if (numberError) throw numberError;

      const result = await onSubmit({
        ...formData,
        account_number: accountNumber as string,
        lab_id: labId // labId should now always be defined here
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
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow"
    >
      <div className="space-y-4">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-bold">
            Add New Client
            {nextAccountNumber && (
              <span className="ml-2 text-gray-500">
                – Account #{nextAccountNumber}
              </span>
            )}
          </h2>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client Name *
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street *
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State *
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ZIP Code *
              </label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Clinic Registration Number
            </label>
            <input
              type="text"
              name="clinicRegistrationNumber"
              value={formData.clinicRegistrationNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Doctors Section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Doctors</h3>
          {(formData?.doctors ?? []).map((doctor, index) => (
            <DoctorFields
              key={index}
              doctor={doctor}
              onChange={(field, value) =>
                handleDoctorChange(index, field, value)
              }
              onRemove={() => removeDoctor(index)}
              showRemove={(formData?.doctors?.length ?? 0) > 1}
            />
          ))}

          <button
            type="button"
            onClick={addDoctor}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Another Doctor
          </button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Client"}
        </button>
      </div>
    </form>
  );
};

export default AddClientForm;
