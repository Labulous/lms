import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Client, ClientInput, Doctor } from "../../services/clientsService";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowDown } from "lucide-react"
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
import { HexColorPicker } from "react-colorful";

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
  const [otherEmailInputs, setOtherEmailInputs] = useState([1]);

  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isAddingPan, setIsAddingPan] = useState(false);

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

  const handleEditClick = (isFirst?: boolean) => {
    // Initialize editedData with all current client data
    setEditedData({
      accountNumber: client.accountNumber,
      clientName: client.clientName,
      contactName: client.contactName,
      phone: client.phone,
      additionalPhone: client.additionalPhone,
      email: client.email,
      billingEmail: client.billingEmail,
      otherEmail: client.otherEmail,
      colorTag: client.colorTag,
      address: {
        street: client.address.street,
        city: client.address.city,
        state: client.address.state,
        zipCode: client.address.zipCode,
        country: client.address.country,
      },
      billingAddress: {
        street: client.billingAddress.street,
        city: client.billingAddress.city,
        state: client.billingAddress.state,
        zipCode: client.billingAddress.zipCode,
        country: client.billingAddress.country,
      },
      clinicRegistrationNumber: client.clinicRegistrationNumber,
      taxRate: client.taxRate,
      salesRepName: client.salesRepName,
      additionalLeadTime: client.additionalLeadTime,
      salesRepNote: client.salesRepNote,
      notes: client.notes ?? "",
      doctors: client.doctors?.map((doctor, index) => ({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        notes: doctor.notes ?? "",
        order: `${client.accountNumber}-${index + 1}`,
      })),
    });
    isFirst ? null : setIsEditing(true);
    setOtherEmailInputs(
      client?.otherEmail?.map((_item, idex) => idex + 1) || [1]
    );
  };

  useEffect(() => {
    handleEditClick(true);
  }, []);
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
      if (name.startsWith("billingAddress.")) {
        const addressField = name.split(".")[1]; // Extract the specific address field
        return {
          ...prev,
          billingAddress: {
            ...prev.billingAddress,
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
      const newDoctorOrder = `${prev.accountNumber}-${(prev.doctors?.length ?? 0) + 1}`;
      return {
        ...prev,
        doctors: [
          ...(prev.doctors || []),
          { name: "", phone: "", email: "", notes: "", order: newDoctorOrder },
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
    debugger;
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
  console.log(editedData, "Form");

  const handleOtherEmail = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!Array.isArray(editedData?.otherEmail)) return;
    const newOtherEmails = [...editedData?.otherEmail];
    newOtherEmails[index] = event.target.value;
    setEditedData({ ...editedData, otherEmail: newOtherEmails });
  };

  const addOtherEmail = () => {
    setOtherEmailInputs([...otherEmailInputs, otherEmailInputs.length + 1]);
  };

  const removeOtherEmail = (index: number) => {
    if (!Array.isArray(editedData?.otherEmail)) return;
    const newOtherEmails = editedData?.otherEmail.filter((_, i) => i !== index);
    setEditedData({ ...editedData, otherEmail: newOtherEmails });
    setOtherEmailInputs(otherEmailInputs.slice(0, -1));
  };

  const handleColorChange = (field: keyof ClientInput, value: string | undefined) => {
    setEditedData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        [field]: value ?? "",
      };
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    debugger;
    if (!editedData?.doctors) return;

    const newDoctors = [...editedData.doctors];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newDoctors.length) return;

    // Swap elements
    [newDoctors[index], newDoctors[newIndex]] = [newDoctors[newIndex], newDoctors[index]];
    setEditedData({ ...editedData, doctors: newDoctors });
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
                      Last Updated:{" "}
                      {client.updated_at
                        ? format(new Date(client.updated_at), "PPp")
                        : "N/A"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Created:{" "}
                    {client.created_at
                      ? format(new Date(client.created_at), "PPp")
                      : "N/A"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="space-x-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => handleEditClick()}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
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
                {/* <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Number</Label>
                  <Input
                    name="accountNumber"
                    value={
                      isEditing
                        ? editedData?.accountNumber ?? ""
                        : client.accountNumber
                    }
                    className="bg-muted"
                    onChange={handleInputChange}
                  />
                </div> */}

                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* Account Number Field */}
                  <div>
                    <Label htmlFor="accountNumber">Account Number*</Label>
                    <Input
                      name="accountNumber"
                      value={
                        isEditing
                          ? editedData?.accountNumber ?? ""
                          : client.accountNumber
                      }
                      className="bg-muted"
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Color Tag */}
                  <div>
                    <Label>Color Tag</Label>
                    <div className="relative">
                      <div className="flex gap-1 relative items-center">
                        <div
                          className={`flex h-8 w-10 rounded-md cursor-pointer relative bg-white ${isEditing ? "border-2 border-gray-400" : "opacity-50 cursor-not-allowed"
                            }`}
                          style={{
                            backgroundColor: editedData?.colorTag || "white",
                            border: "2px solid rgba(0,0,0,0.4)",
                          }}
                          onClick={() => {
                            if (isEditing) setIsAddingPan(!isAddingPan);
                          }}
                        >
                          {!editedData?.colorTag && (
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

                      {isAddingPan && isEditing && (
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
                                variant={isCustomColor ? "secondary" : "destructive"}
                              >
                                Select Colors
                              </Button>
                              <Button
                                size={"sm"}
                                onClick={() => setIsCustomColor(true)}
                                className="w-1/2"
                                variant={isCustomColor ? "destructive" : "secondary"}
                              >
                                Select Custom Color
                              </Button>
                            </div>

                            {!isCustomColor ? (
                              <div className="grid grid-cols-5 gap-2 bg-white z-50">
                                <div
                                  className={`h-12 w-12 rounded-md cursor-pointer relative bg-white ${!editedData?.colorTag ? "border-2 border-black" : "border-2 border-gray-200"
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
                                {colors.map((item, key) => (
                                  <div
                                    key={key}
                                    className={`h-12 w-12 rounded-md cursor-pointer ${editedData?.colorTag === item ? "border-2 border-black" : ""
                                      }`}
                                    style={{ backgroundColor: item }}
                                    onClick={() => {
                                      handleColorChange("colorTag", item);
                                      setIsAddingPan(false);
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <HexColorPicker
                                color={editedData?.colorTag || "#ffffff"}
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


                <div className="space-y-2">
                  <Label className="text-sm font-medium">Client Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="clientName"
                      value={
                        isEditing
                          ? editedData?.clientName ?? ""
                          : client.clientName
                      }
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
                      value={
                        isEditing
                          ? editedData?.contactName ?? ""
                          : client.contactName
                      }
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
                  <Label className="text-sm font-medium">
                    Additional Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="additionalPhone"
                      value={
                        isEditing
                          ? editedData?.additionalPhone ?? ""
                          : client.additionalPhone
                      }
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Billing Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="billingEmail"
                      value={
                        isEditing
                          ? editedData?.billingEmail ?? ""
                          : client.billingEmail
                      }
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 w-full justify-center items-center gap-2">
                  {otherEmailInputs.map((_, index) => (
                    <div
                      key={index}
                      className="mt-2 flex flex-col items-center gap-2 w-full"
                    >
                      <Label htmlFor={`otherEmail-${index}`}>
                        Other Email {index + 1}
                      </Label>
                      <div className="flex  gap-1 items-center w-full">
                        <div className="relative w-full">
                          <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`otherEmail-${index}`}
                            name={`otherEmail-${index}`}
                            type="email"
                            value={
                              isEditing
                                ? editedData?.otherEmail?.[index]
                                : client.otherEmail?.[index] || ""
                            }
                            onChange={(e) => handleOtherEmail(index, e)}
                            className="mt-0.5 w-full pl-8"
                          />
                        </div>
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
                  {isEditing && (
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={addOtherEmail}
                        className="mt-6 bg-blue-500 text-white px-2 py-2 rounded"
                      >
                        Add Other Email
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional Notes</Label>
                  <Textarea
                    name="notes"
                    value={
                      isEditing ? editedData?.notes ?? "" : client.notes ?? ""
                    }
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Street</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="address.street"
                          value={
                            isEditing
                              ? editedData?.address?.street ?? ""
                              : client.address.street
                          }
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
                        value={
                          isEditing
                            ? editedData?.address?.city ?? ""
                            : client.address.city
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">State</Label>
                      <Input
                        name="address.state"
                        value={
                          isEditing
                            ? editedData?.address?.state ?? ""
                            : client.address.state
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Zip Code</Label>
                      <Input
                        name="address.zipCode"
                        value={
                          isEditing
                            ? editedData?.address?.zipCode ?? ""
                            : client.address.zipCode
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Country</Label>
                      <Input
                        name="address.country"
                        value={
                          isEditing
                            ? editedData?.address?.country ?? ""
                            : client.address.country
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">Billing Address</CardTitle>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sameAsDelivery"
                          checked={
                            JSON.stringify({
                              street: editedData?.billingAddress?.street,
                              city: editedData?.billingAddress?.city,
                              state: editedData?.billingAddress?.state,
                              zipCode: editedData?.billingAddress?.zipCode,
                              country: editedData?.billingAddress?.country,
                            }) ===
                            JSON.stringify({
                              street: editedData?.address?.street,
                              city: editedData?.address?.city,
                              state: editedData?.address?.state,
                              zipCode: editedData?.address?.zipCode,
                              country: editedData?.address?.country,
                            })
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditedData((prev) => ({
                                ...prev!,
                                billingAddress: {
                                  street: prev?.address?.street || "",
                                  city: prev?.address?.city || "",
                                  state: prev?.address?.state || "",
                                  zipCode: prev?.address?.zipCode || "",
                                  country: prev?.address?.country || "",
                                },
                              }));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="sameAsDelivery" className="text-sm font-normal text-muted-foreground">
                          Same as Delivery Address
                        </Label>
                      </div>
                    ) : (
                      JSON.stringify({
                        street: client.billingAddress.street,
                        city: client.billingAddress.city,
                        state: client.billingAddress.state,
                        zipCode: client.billingAddress.zipCode,
                        country: client.billingAddress.country,
                      }) ===
                      JSON.stringify({
                        street: client.address.street,
                        city: client.address.city,
                        state: client.address.state,
                        zipCode: client.address.zipCode,
                        country: client.address.country,
                      }) && (
                        <span className="text-sm text-muted-foreground">
                          (Same as Delivery Address)
                        </span>
                      )
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Street</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="billingAddress.street"
                          value={
                            isEditing
                              ? editedData?.billingAddress?.street ?? ""
                              : client.billingAddress.street
                          }
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">City</Label>
                      <Input
                        name="billingAddress.city"
                        value={
                          isEditing
                            ? editedData?.billingAddress?.city ?? ""
                            : client.billingAddress.city
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">State</Label>
                      <Input
                        name="billingAddress.state"
                        value={
                          isEditing
                            ? editedData?.billingAddress?.state ?? ""
                            : client.billingAddress.state
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Zip Code</Label>
                      <Input
                        name="billingAddress.zipCode"
                        value={
                          isEditing
                            ? editedData?.billingAddress?.zipCode ?? ""
                            : client.billingAddress.zipCode
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Country</Label>
                      <Input
                        name="billingAddress.country"
                        value={
                          isEditing
                            ? editedData?.billingAddress?.country ?? ""
                            : client.billingAddress.country
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Clinic Registration Number
                </Label>
                <Input
                  name="clinicRegistrationNumber"
                  value={
                    isEditing
                      ? editedData?.clinicRegistrationNumber ?? ""
                      : client.clinicRegistrationNumber
                  }
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tax Rate (%)</Label>
                <Input
                  name="taxRate"
                  type="number"
                  value={isEditing ? editedData?.taxRate ?? "" : client.taxRate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sales Rep Name</Label>
                <Input
                  name="salesRepName"
                  value={
                    isEditing
                      ? editedData?.salesRepName ?? ""
                      : client.salesRepName
                  }
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Additional Lead Time (Days)
                </Label>
                <Input
                  name="additionalLeadTime"
                  type="number"
                  value={
                    isEditing
                      ? editedData?.additionalLeadTime ?? ""
                      : client.additionalLeadTime
                  }
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional Notes</Label>
                <Textarea
                  name="salesRepNote"
                  value={
                    isEditing
                      ? editedData?.salesRepNote ?? ""
                      : client.salesRepNote
                  }
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
                <Button variant="outline" size="sm" onClick={addDoctor}>
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
                  {(isEditing ? editedData?.doctors : client.doctors)?.map((doctor, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Doctor #{index + 1}</CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Order #{editedData?.accountNumber ? `${editedData.accountNumber}-${index + 1}` : index + 1}
                          </span>

                          {isEditing && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMove(index, "up")}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4 text-blue-500" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMove(index, "down")}
                                disabled={index === (editedData?.doctors?.length ?? client.doctors?.length) - 1}
                              >
                                <ArrowDown className="h-4 w-4 text-blue-500" />
                              </Button>
                            </>
                          )}

                          {/* Remove Doctor Button (Only in edit mode) */}
                          {isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => removeDoctor(index)}>
                              <UserMinus className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      {/* Doctor Fields */}
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
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAccountInfo;
