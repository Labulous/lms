import { SettingsTabs } from "./SettingsTabs";
import { CaseWorkflowSettingsContent } from "./SettingsContent";
import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  createUserByAdmins,
  getCurrentUser,
  getLabIdByUserId,
  signUp,
} from "@/services/authService";
import { Users } from "@/types/supabase";
import { formatDate } from "@/lib/formatedDate";
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Doctor {
  id?: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface userFormData {
  role: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
  contactName: string;
  password: string;
  confirmPassword: string;
}

import Layout from "@/components/layout/Layout";
import { DatePicker } from "@/components/ui/date-picker";
import DoctorFields from "@/components/clients/DoctorFields";
import { Anybody } from "@next/font/google";
import { emit } from "process";
import { clientsService } from "@/services/clientsService";
import { useNavigate } from "react-router-dom";
export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Users[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, seteditingUser] = useState<Users | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [nextAccountNumber, setNextAccountNumber] = useState<string>("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<userFormData>({
    role: "",
    firstname: "",
    lastname: "",
    name: "",
    email: "",
    phone: "",
    contactName: "",
    password: "",
    confirmPassword: "",
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

  const roles = {
    super_admin: [
      { label: "Admin", role: "admin" },
      { label: "Client", role: "client" },
      { label: "Technician", role: "technician" },
    ],
    admin: [
      { label: "Admin", role: "admin" },
      { label: "Technician", role: "technician" },
    ],
  };
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData?.labId) {
        toast.error("Lab not found");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("lab_id", labData.labId)
        .order("created_at", { ascending: false })
        .or("is_archive.is.null,is_archive.eq.false");

      if (error) throw error;
      setUsers(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setLoading(false);
    }
  };
  console.log(users, "users");
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [user?.id]);
  console.log(user, "users");

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

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(formData);
    setLoading(true);
    e.preventDefault();
    formData.name = formData.firstname + " " + formData.lastname;
    const labData = await getLabIdByUserId(user?.id as string);
    if (!labData?.labId) {
      toast.error("Lab not found");
      return;
    }
    try {
      if (editingUser) {
        // const { error } = await supabase
        //     .from("users")
        //     .update({
        //         name: formData.name,
        //         firstname: formData.firstname,
        //         lastname: formData.lastname,
        //         lab_id: labData.labId,
        //         email: formData.email,
        //         //updated_at: new Date().toISOString(),
        //     })
        //     .eq("id", editingUser.id);

        const { data, error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            firstname: formData.firstname,
            lastname: formData.lastname,
            lab_id: labData.labId,
            email: formData.email,
            phone: formData.phone,
            //updated_at: new Date().toISOString(),
          })
          .eq("id", editingUser.id)
          .select("*");
        console.log(data);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        //if (error) throw error;
        toast.success("User updated successfully");
        setLoading(false);
      } else {
        await createUserByAdmins(
          labData.labId,
          formData.role,
          formData.name,
          formData.firstname,
          formData.lastname,
          formData.email,
          formData.phone,
          formData.password
        );

        // if (formData.role == "client") {
        //     await createUserByAdmins(labData.labId,
        //         formData.role,
        //         formData.name,
        //         formData.firstname,
        //         formData.lastname,
        //         formData.email,
        //         formData.password,
        //         {
        //             accountNumber: nextAccountNumber,
        //             clientName: formData.name,
        //             contactName: formData.contactName,
        //             phone: formData.phone,
        //             street: formData.address.street,
        //             city: formData.address.city,
        //             state: formData.address.state,
        //             zipCode: formData.address.zipCode,
        //             clinicRegistrationNumber: formData.clinicRegistrationNumber,
        //             notes: formData.notes,
        //         });
        // }
        // else {
        //     await createUserByAdmins(labData.labId, formData.role, formData.name, formData.firstname, formData.lastname, formData.email, formData.password);
        // }
        //if (error) throw error;
        toast.success("User created successfully");
      }

      setIsDialogOpen(false);
      seteditingUser(null);
      setFormData({
        role: "",
        name: "",
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        contactName: "",
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
      fetchUsers();
      setLoading(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
      setLoading(false);
    }
  };

  const handleEdit = (user: Users) => {
    seteditingUser(user);
    setFormData({
      role: user.role,
      name: user.name,
      firstname: user?.firstname,
      lastname: user?.lastname,
      email: user.email,
      password: "",
      confirmPassword: "",
      phone: user?.phone,
      contactName: "",
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
    setIsDialogOpen(true);
  };

  const handleDelete = async (user: Users) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("working_pans")
        .delete()
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Pan deleted successfully");
      fetchUsers();
      setLoading(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
      setLoading(false);
    }
  };

  const handleDeleteClient = async (user: Users) => {
    console.log(user, "user deleted");

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_archive: true })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      await fetchUsers(); // Refresh the list
      toast.success("Client deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete client");
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === "confirmPassword" && formData.password !== value) {
      setError("Passwords do not match.");
    } else {
      setError("");
    }
  };

  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        <SettingsTabs />
        <div className="flex-1 p-6">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      seteditingUser(null);
                      setFormData({
                        role: "",
                        name: "",
                        firstname: "",
                        lastname: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        phone: "",
                        contactName: "",
                        address: {
                          street: "",
                          city: "",
                          state: "",
                          zipCode: "",
                        },
                        clinicRegistrationNumber: "",
                        notes: "",
                        doctors: [
                          { name: "", phone: "", email: "", notes: "" },
                        ],
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent
                  style={{
                    maxWidth: "1000px",
                    width: "750px",
                    maxHeight: "80vh",
                    overflowY: "auto",
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? "Edit User" : "Create New User"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Role *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, role: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {user?.role == "admin" &&
                              roles.admin.map((item, index) => {
                                return (
                                  <SelectItem key={index} value={item.role}>
                                    {item.label}
                                  </SelectItem>
                                );
                              })}
                            {user?.role == "super_admin" &&
                              roles.super_admin.map((item, index) => {
                                return (
                                  <SelectItem key={index} value={item.role}>
                                    {item.label}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">
                          {" "}
                          {formData.role == "client"
                            ? "Client First Name *"
                            : "First Name *"}{" "}
                        </Label>
                        <Input
                          id="name"
                          value={formData.firstname}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firstname: e.target.value,
                            }))
                          }
                          placeholder="Enter name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          {" "}
                          {formData.role == "client"
                            ? "Client Last Name *"
                            : "Last Name *"}{" "}
                        </Label>
                        <Input
                          id="name"
                          value={formData.lastname}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lastname: e.target.value,
                            }))
                          }
                          placeholder="Enter name"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Email *</Label>
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="Enter email"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Phone</Label>
                        <Input
                          id="phone"
                          type="number"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    {!editingUser && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={handlePasswordChange}
                              placeholder="Enter password"
                              required
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                            >
                              {showPassword ? (
                                <EyeOff
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Eye className="h-5 w-5" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter confirm password"
                              required
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                            >
                              {showConfirmPassword ? (
                                <EyeOff
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Eye className="h-5 w-5" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </div>
                        {error && <p className="text-red-500">{error}</p>}
                      </div>
                    )}

                    {formData.role == "client" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Contact name</Label>
                          <Input
                            id="contactName"
                            value={formData.contactName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                contactName: e.target.value,
                              }))
                            }
                            placeholder="Enter contact name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Client Registration Name</Label>
                          <Input
                            id="clinicRegistrationNumber"
                            value={formData.clinicRegistrationNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                clinicRegistrationNumber: e.target.value,
                              }))
                            }
                            placeholder="Enter clinic registration number"
                          />
                        </div>
                      </div>
                    )}

                    {formData.role == "client" && (
                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-4">
                          <Label htmlFor="name">Notes</Label>
                          <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder=""
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                    {formData.role == "client" && (
                      <div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Address
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Street *</Label>
                            <Input
                              id="street"
                              value={formData.address.street}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  address: {
                                    ...prev.address,
                                    street: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter street"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">City *</Label>
                            <Input
                              id="city"
                              value={formData.address.city}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  address: {
                                    ...prev.address,
                                    city: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter city"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">State *</Label>
                            <Input
                              id="state"
                              value={formData.address.state}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  address: {
                                    ...prev.address,
                                    state: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter state"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">ZIP Code *</Label>
                            <Input
                              id="zipCode"
                              value={formData.address.zipCode}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  address: {
                                    ...prev.address,
                                    zipCode: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter zipcode"
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Doctors
                          </h3>
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
                    )}

                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {editingUser
                          ? loading
                            ? "Updating User"
                            : "Update User"
                          : loading
                          ? "Creating User"
                          : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.phone}
                      </TableCell>
                      <TableCell className="font-medium">{user.role}</TableCell>

                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClient(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
