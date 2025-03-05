import React, { useState, useEffect } from "react";
import DoctorFields from "./DoctorFields";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { getLabIdByUserId } from "../../services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Client, Address, Doctor } from "@/types/supabase";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useAuth } from "@/contexts/AuthContext";
import { ColorPicker } from "@/components/ui/color-picker";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Plus, Trash2, X } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

const colors = [
  "#FF5733", // Vibrant Red-Orange
  "#33FF57", // Bright Green
  "#3357FF", // Bold Blue
  "#FF33A8", // Hot Pink
  "#FFD133", // Bright Yellow
  "#33FFF5", // Aqua Blue
  "#8D33FF", // Deep Purple
  "#FF8633", // Soft Orange
  "#33FF99", // Mint Green
  "#FF3333", // Bright Red
  "#4CAF50", // Forest Green
  "#FFC107", // Amber
  "#9C27B0", // Amethyst Purple
  "#2196F3", // Sky Blue
  "#FF9800", // Vivid Orange
  "#E91E63", // Raspberry Pink
  "#607D8B", // Cool Gray
  "#673AB7", // Royal Purple
  "#00BCD4", // Cerulean Blue
  "#FFEB3B", // Lemon Yellow
];


interface ClientInput {
  clientName: string;
  contactName: string;
  phone: string;
  email: string;
  address: Required<Address>;
  billingAddress: Address;
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
  billingEmail: string;
  otherEmail?: string[];
  additionalPhone?: string;
  taxRate?: number;
  salesRepName?: string;
  salesRepNote?: string;
  additionalLeadTime?: number;
  lab_id?: string;
  account_number?: string;
  workingTagName?: string;
  colorTag?: string;
}

interface AddClientFormProps {
  onSubmit: (data: ClientInput) => void;
  onCancel: () => void;
  loading?: boolean;
  onSuccess?: () => void;
}
export interface WorkingTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const AddClientForm: React.FC<AddClientFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  onSuccess,
}) => {
  const [nextAccountNumber, setNextAccountNumber] = useState<string>("");
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  const { user } = useAuth();
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
      country: "",
    },
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    clinicRegistrationNumber: "",
    notes: "",
    doctors: [{ name: "", phone: "", email: "", notes: "", order: "1" }],
    billingEmail: "",
    otherEmail: [""],
    additionalPhone: "",
    taxRate: 0,
    salesRepName: "",
    salesRepNote: "",
    additionalLeadTime: 0,
    account_number: "",
    colorTag: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<WorkingTag[]>([]);
  const [pans, setPans] = useState<WorkingTag[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [editingTag, setEditingTag] = useState<WorkingTag | null>(null);
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isAddingPan, setIsAddingPan] = useState(false);
  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    supabase.from("users").select("lab_id").eq("id", user?.id).single(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

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
        if (error) throw error;
        setNextAccountNumber(data);
        formData.account_number === ""
          ? setFormData((prev) => ({ ...prev, account_number: data }))
          : null;
      } catch (error) {
        console.error("Error fetching next account number:", error);
        toast.error("Failed to generate account number");
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
    } else if (name.startsWith("billingAddress.")) {
      const billingAddressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [billingAddressField]: value,
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

  // const addDoctor = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     doctors: [
  //       ...(prev?.doctors ?? []),
  //       { name: "", phone: "", email: "", notes: "" },
  //     ],
  //   }));
  // };

  const addDoctor = () => {
    setFormData((prev) => ({
      ...prev,
      doctors: [
        ...(prev?.doctors ?? []),
        {
          name: "",
          phone: "",
          email: "",
          notes: "",
          order: `${prev?.account_number}-${(prev?.doctors?.length ?? 0) + 1}`,
        },
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

  const handleSameAsDeliveryChange = (checked: boolean) => {
    setSameAsDelivery(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          street: prev.address.street,
          city: prev.address.city,
          state: prev.address.state,
          zipCode: prev.address.zipCode,
          country: prev.address.country,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Get lab_id for the current user
      const labData = await getLabIdByUserId(user.id);
      if (!labData) {
        toast.error("Lab ID not found");
        return;
      }

      const clientData = {
        ...formData,
        lab_id: labData.labId,
      };
      console.log(clientData, "clientData");
      await onSubmit(clientData);

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
          country: "",
        },
        billingAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        clinicRegistrationNumber: "",
        notes: "",
        doctors: [{ name: "", phone: "", email: "", notes: "" }],
        billingEmail: "",
        otherEmail: [],
        additionalPhone: "",
        taxRate: 0,
        salesRepName: "",
        salesRepNote: "",
        additionalLeadTime: 0,
        account_number: "",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(formData, "formData");

  const [otherEmailInputs, setOtherEmailInputs] = useState([1]);

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


  const WorkingTagSelect = ({
    value,
    onValueChange,
    tags,
    onEdit,
    onDelete,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    tags: WorkingTag[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Select
        value={value}
        onValueChange={onValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Select Tag" className="text-gray-500">
            {value && tags.find((t) => t.id === value) && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: tags.find((t) => t.id === value)?.color,
                  }}
                />
                <span>
                  {tags.find((t) => t.id === value)?.name || "Unnamed tag"}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="max-h-[200px] overflow-y-auto"
        >
          {tags && tags.length > 0 ? (
            tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id} className="pr-24">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name || "Unnamed tag"}</span>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(tag.id);
                      setIsOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(tag.id);
                      setIsOpen(false);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="_no_tags" disabled>
              No tags available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    );
  };

  const handleEditTag = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      setEditingTag(tag);
      setIsEditingTag(true);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !user) return;

    try {
      setLoading(true);
      const labId = await getLabIdByUserId(user.id);
      if (!labId) {
        throw new Error("No lab found for user");
      }

      const { error } = await supabase
        .from("working_tags")
        .update({
          name: editingTag.name,
          color: editingTag.color,
        })
        .eq("id", editingTag.id);

      if (error) throw error;

      // Update local state
      setTags(tags.map((tag) => (tag.id === editingTag.id ? editingTag : tag)));

      setIsEditingTag(false);
      setEditingTag(null);
      toast.success("Tag updated successfully");
    } catch (error) {
      console.error("Error updating tag:", error);
      toast.error("Failed to update tag");
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field: keyof typeof formData, value: string | undefined) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!formData?.doctors) return;

    const newDoctors = [...formData.doctors];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newDoctors.length) return;

    // Swap elements
    [newDoctors[index], newDoctors[newIndex]] = [newDoctors[newIndex], newDoctors[index]];
    setFormData({ ...formData, doctors: newDoctors });
  };



  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Add New Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 items-center">
              {/* Account Number Input */}
              <div>
                <Label htmlFor="account_number">Account Number*</Label>
                <Input
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  className="mt-1"
                  required
                />
              </div>

              {/* Optional Second Input or Color Box */}
              <div>
                <Label>Color Tag</Label>
                <div className="relative">
                  <div className="flex gap-1 relative items-center">
                    <div
                      className={`flex h-8 w-10 rounded-md cursor-pointer relative bg-white`}
                      style={{
                        backgroundColor: formData.colorTag || "white",
                        border: "2px solid rgba(0,0,0,0.4)",
                      }}
                      onClick={() => setIsAddingPan(!isAddingPan)}
                    >
                      {!formData.colorTag && (
                        <div
                          className="absolute inset-0"
                          style={{
                            content: '""',
                            background: `linear-gradient(to top right, transparent calc(50% - 2px), rgba(0,0,0,0.4), transparent calc(50% + 2px))`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  {isAddingPan && (
                    <div
                      className="w-72 absolute top-12 bg-white p-2 z-50 border rounded-md"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex justify-end py-2">
                        <button onClick={() => setIsAddingPan(false)}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className=" space-y-5 bg-white">
                        <div className="flex w-full gap-4">
                          <Button
                            size={"sm"}
                            onClick={() => setIsCustomColor(false)}
                            className="w-1/2"
                            variant={
                              isCustomColor ? "secondary" : "destructive"
                            }
                          >
                            Select Colors
                          </Button>
                          <Button
                            size={"sm"}
                            onClick={() => setIsCustomColor(true)}
                            className="w-1/2"
                            variant={
                              isCustomColor ? "destructive" : "secondary"
                            }
                          >
                            Select Custom Color
                          </Button>
                        </div>
                        {!isCustomColor ? (
                          <div className="grid grid-cols-5 gap-2 bg-white z-50">
                            <div
                              className={`h-12 w-12 rounded-md cursor-pointer relative bg-white ${!formData.colorTag
                                ? "border-2 border-black"
                                : "border-2 border-gray-200"
                                }`}
                              onClick={() => handleColorChange("colorTag", undefined)}
                            >
                              <div
                                className="absolute inset-0"
                                style={{
                                  content: '""',
                                  background: `linear-gradient(to top right, transparent calc(50% - 2px), rgba(0,0,0,0.4), transparent calc(50% + 2px))`,
                                }}
                              />
                            </div>
                            {colors.map((item, key) => {
                              return (
                                <div
                                  key={key}
                                  className={`h-12 w-12 rounded-md cursor-pointer ${formData.colorTag === item
                                    ? "border-2 border-black"
                                    : ""
                                    }`}
                                  style={{
                                    backgroundColor: item,
                                  }}
                                  onClick={() => {
                                    handleColorChange("colorTag", item);
                                    setIsAddingPan(false);
                                  }}
                                ></div>
                              );
                            })}
                          </div>
                        ) : (
                          <HexColorPicker
                            color={formData.colorTag || "#ffffff"}
                            onChange={(color) => {
                              handleColorChange("colorTag", color);
                            }}
                            style={{ width: "100%" }}
                          />

                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Primary Phone</Label>
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
                <div key={index} className="space-y-2">
                  <Label htmlFor={`otherEmail-${index}`}>Other Email {index + 1}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`otherEmail-${index}`}
                      name={`otherEmail-${index}`}
                      type="email"
                      value={formData?.otherEmail?.[index] || ""}
                      onChange={(e) => handleOtherEmail(index, e)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removeOtherEmail(index)}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  type="button"
                  onClick={addOtherEmail}
                  variant="outline"
                  className="w-full mt-1"
                >
                  Add Other Email
                </Button>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-2 gap-6">
            {/* Primary Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Primary Address
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="address.street">Street</Label>
                  <Input
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="address.city">City</Label>
                    <Input
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.state">State</Label>
                    <Input
                      id="address.state"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="address.zipCode">Zip Code</Label>
                    <Input
                      id="address.zipCode"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.country">Country</Label>
                    <Input
                      id="address.country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address */}
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
                    onChange={(e) => handleSameAsDeliveryChange(e.target.checked)}
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
                    value={sameAsDelivery ? formData.address.street : formData.billingAddress?.street}
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
                      value={sameAsDelivery ? formData.address.city : formData.billingAddress?.city}
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
                      value={sameAsDelivery ? formData.address.state : formData.billingAddress?.state}
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="billingAddress.zipCode">Zip Code</Label>
                    <Input
                      id="billingAddress.zipCode"
                      name="billingAddress.zipCode"
                      value={sameAsDelivery ? formData.address.zipCode : formData.billingAddress?.zipCode}
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingAddress.country">Country</Label>
                    <Input
                      id="billingAddress.country"
                      name="billingAddress.country"
                      value={sameAsDelivery ? formData.address.country : formData.billingAddress?.country}
                      onChange={handleInputChange}
                      disabled={sameAsDelivery}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="mt-1 h-24 w-full"
              placeholder="Enter any additional notes about the client..."
            />
          </div>

          {/* Additional Information */}
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
              <div className="col-span-2">
                <Label htmlFor="salesRepNote">Additional Notes</Label>
                <Textarea
                  id="salesRepNote"
                  name="salesRepNote"
                  value={formData.salesRepNote}
                  onChange={handleInputChange}
                  className="mt-1 h-24"
                />
              </div>
            </div>
          </div>



          {/* Doctor Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Doctor Information
            </h3>
            <div className="space-y-6">
              {/* {formData.doctors.map((doctor, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-md border border-slate-200 overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
                  <div className="p-4">
                    <div className="p-4 relative">
                      <div className="flex justify-between text-sm font-medium text-slate-400">
                        <span>Doctor #{index + 1}</span>
                        <span>Order: {index + 1}</span>
                      </div>
                      <DoctorFields
                        doctor={doctor}
                        onChange={(field, value) => {
                          const updatedDoctors = [...formData.doctors];
                          updatedDoctors[index] = {
                            ...updatedDoctors[index],
                            [field]: value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            doctors: updatedDoctors,
                          }));
                        }}
                        onRemove={() => {
                          const updatedDoctors = formData.doctors.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            doctors: updatedDoctors,
                          }));
                        }}
                        showRemove={formData.doctors.length > 1}
                      />
                    </div>

                  </div>
                </div>
              ))} */}

              {(formData?.doctors ?? []).map((doctor, index) => (
                <div key={index} className="relative bg-white rounded-md border border-slate-200 overflow-hidden p-4">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />

                  {/* Doctor Left | Order + Arrows Right */}
                  <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                    <span className="text-left">Doctor #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-right">Order: {formData?.account_number}-{index + 1}</span>
                      <button
                        type="button"
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="text-blue-600 w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                        onClick={() => handleMove(index, "down")}
                        disabled={(formData?.doctors?.length ?? 0) - 1 === index}
                      >
                        <ArrowDown className="text-blue-600 w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Doctor Fields */}
                  <DoctorFields
                    doctor={doctor}
                    onChange={(field, value) => handleDoctorChange(index, field as keyof Doctor, value)}
                    onRemove={() => removeDoctor(index)}
                    showRemove={(formData?.doctors?.length ?? 0) > 1}
                  />
                </div>
              ))}

            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  doctors: [
                    ...prev.doctors,
                    { name: "", phone: "", email: "", notes: "" },
                  ],
                }));
              }}
              className="mt-2"
            >
              Add Another Doctor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Client"}
        </Button>
      </div>
    </form>
  );
};

export default AddClientForm;
