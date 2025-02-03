
import { SettingsTabs } from './SettingsTabs';
import { CaseWorkflowSettingsContent } from './SettingsContent';
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from '@/components/layout/Layout';
import { labDetail, OfficeAddress } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Building, Building2, Eye, EyeOff, Mail, MapPin, Pencil, Phone, Save, Upload, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { eachMonthOfInterval } from 'date-fns';
import { uploadFile } from '@/lib/fileUploads';
import { useLocation, useNavigate } from 'react-router-dom';
import { Separator } from '@radix-ui/react-select';
import { name } from 'ejs';
import { useReactToPrint } from 'react-to-print';

interface LabProfileFormData {
    name: string,
    attachements?: string,
    id?: string;
    office_address_id?: string,
    office_address: OfficeAddress;
    file: File | null
}

interface user {
    id: string,
    name: string,
    firstname: string,
    lastname: string,
    email: string,
    phone_number: string,
    attachements?: string,
    role: string;
    file: File | null
}


export const MyAccount: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("user-profile");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    console.log('loggedin user', user)


    const [formData, setFormData] = useState<user>({
        id: "",
        name: "",
        firstname: "",
        lastname: "",
        email: "",
        phone_number: "",
        role: "",
        attachements: "",
        file: null
    });

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });


    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setPasswordData((prev) => {
            const updatedData = { ...prev, [id]: value };

            if (updatedData.newPassword.length > 0 && updatedData.confirmPassword.length > 0) {
                if (updatedData.newPassword !== updatedData.confirmPassword) {
                    setError("Passwords do not match.");
                } else {
                    setError("");
                }
            }

            return updatedData;
        });
    };


    const handleChangePassword = async () => {
        debugger
        if (!passwordData) return;
        console.log(passwordData);
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }

        if (user) {
            try {
                const { error } = await supabase.auth.updateUser({
                    password: passwordData.newPassword,
                });

                if (error) {
                    throw new Error(error.message);
                }

                toast.success("Password changed successfully!");

                setPasswordData({ newPassword: "", confirmPassword: "" });

                setTimeout(() => {
                    navigate("/settings/user-profile", { replace: true });
                }, 100);

            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error("Error:", error.message);
                    alert(error.message);
                } else {
                    console.error("Unknown error occurred");
                    alert("An unknown error occurred");
                }
            }
        } else {
            console.log("User is not authenticated.");
            alert("You must be logged in to change your password.");
        }
    };





    useEffect(() => {
        if (!user?.id) return; // Ensure user ID is available     
        fetchUserData();
    }, [user?.id]);

    const fetchUserData = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", user?.id);

            if (error) throw error;

            if (data && data.length > 0) {
                setFormData({
                    id: data[0].id,
                    name: data[0].name,
                    firstname: data[0].firstname,
                    lastname: data[0].lastname,
                    email: data[0].email,
                    phone_number: data[0].phone,
                    role: data[0].role,
                    attachements: data[0].attachements,
                    file: null,

                });
            }
        } catch (error) {

        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };


    const handleSave = async (e: React.FormEvent) => {
        debugger;
        if (!formData) return;
        console.log(formData);

        setLoading(true);
        e.preventDefault();

        // Attempt to update user email
        const { data, error: authError } = await supabase.auth.updateUser({
            data: {
                email: formData.email
            },
        });

        if (authError) {
            throw new Error(authError.message); // Handle error
        }

        const updatedUser = data; // Access updated user data
        console.log(updatedUser); // Log the updated user for confirmation



        // try {
        //     if (isEditing) {
        //         let publicUrlData = null;
        //         if (formData.file) {
        //             const fileName = `${Date.now()}_${formData.file?.name}`;
        //             console.log(fileName);
        //             const { data: logodata, error: userPhotoerror } = await supabase.storage
        //                 .from(`user-photos`)
        //                 .upload(fileName, formData?.file as File, {
        //                     cacheControl: "3600",
        //                     upsert: false,
        //                 });

        //             if (userPhotoerror) {
        //                 console.log('user-photos error-----', userPhotoerror);
        //                 throw userPhotoerror;
        //             }

        //             // Get the public URL for the uploaded file
        //             const { data: publicUrlResponse } = supabase.storage
        //                 .from("user-photos")
        //                 .getPublicUrl(fileName);

        //             if (!publicUrlResponse) {
        //                 throw new Error("Failed to retrieve public URL");
        //             }
        //             publicUrlData = publicUrlResponse.publicUrl;;
        //         }


        //         const { error } = await supabase
        //             .from("users")
        //             .update({
        //                 name: formData.firstname + " " + formData.lastname,
        //                 firstname: formData.firstname,
        //                 lastname: formData.lastname,
        //                 phone: formData.phone_number,
        //                 email: formData.email,
        //                 attachements: formData.file ? publicUrlData : formData.attachements ? formData.attachements : "",
        //             })
        //             .eq("id", formData.id);

        //         if (error) throw error;

        //         toast.success("User profile updated successfully");

        //         navigate('/', { replace: true });
        //         setLoading(false);
        //         setIsEditing(false);
        //     }

        //     fetchUserData();
        //     setLoading(false);

        //     //window.location.reload();
        // } catch (error) {
        //     console.error("Error updating lab:", error);
        //     console.log("Error updating lab:", error);
        //     toast.error("Failed to update lab");
        //     setLoading(false);
        // }
    };




    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            setFormData((prev) => ({
                ...prev,
                file,
            }));

            console.log("Selected file:", file);
        }

        e.target.value = "";
    };

    const triggerFileInput = () => {
        document.getElementById("fileInput")?.click();
    };


    return (
        <Layout>
            <div className="flex h-full bg-gray-50">
                {/* <SettingsTabs /> */}
                <div className="flex-1 p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        My Account
                    </h2>
                    <div className="space-y-6">
                        <div className="container mx-auto px-4 py-6">
                            {/* Tabs Section */}
                            <div className="border-b">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab("user-profile")}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "user-profile"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        User Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("change-password")}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "change-password"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        Change Password
                                    </button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div className="mt-6">
                                {activeTab === "user-profile" && (
                                    <div className="flex-1 p-6">
                                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                                            User Profile
                                        </h2>
                                        <div className="space-y-6">
                                            <form onSubmit={handleSave}>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-4">
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
                                                            <div className="space-x-2">
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    type='submit'
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
                                                            </div>
                                                        )}
                                                    </CardHeader>

                                                    <CardContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                            <Card className="col-span-12">

                                                                <CardContent className="space-y-4">
                                                                    <div className="space-y-2 mt-5">
                                                                        {isEditing ?
                                                                            <div className="relative">
                                                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                                                    <input
                                                                                        id="fileInput"
                                                                                        type="file"
                                                                                        name="fileUpload"
                                                                                        accept="image/*"
                                                                                        onChange={handleFileChange}
                                                                                        className="hidden"
                                                                                        disabled={!isEditing}
                                                                                    />

                                                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                                                        {selectedImage ? (
                                                                                            <div className="flex justify-center">
                                                                                                <img
                                                                                                    src={selectedImage}
                                                                                                    alt="Uploaded Preview"
                                                                                                    className="w-[150px] h-[50px] object-contain border border-gray-300 rounded-md shadow-sm"
                                                                                                />
                                                                                            </div>
                                                                                        ) : formData?.attachements && formData.attachements.length > 0 ? (
                                                                                            <img
                                                                                                src={formData.attachements}
                                                                                                alt="Lab Logo"
                                                                                                className="w-[150px] h-[50px] object-contain border border-gray-300 rounded-md shadow-sm"
                                                                                            />
                                                                                        ) : (
                                                                                            <p className="text-sm text-gray-500">No image selected</p>
                                                                                        )}

                                                                                        <div className="flex justify-center space-x-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={triggerFileInput}
                                                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                                            >
                                                                                                <Upload className="h-5 w-5 mr-2" />
                                                                                                Upload Files
                                                                                            </button>
                                                                                        </div>

                                                                                        <p className="text-sm text-gray-500">Click the button above to select a lab logo</p>
                                                                                    </div>

                                                                                </div>
                                                                                {formData.file && (
                                                                                    <p className="mt-2 text-sm text-gray-600">
                                                                                        Uploaded file: <strong>{formData.file.name}</strong>
                                                                                    </p>
                                                                                )}
                                                                            </div> :
                                                                            <div>
                                                                                {formData?.attachements && formData.attachements.length > 0 ? (
                                                                                    <img
                                                                                        src={formData.attachements}
                                                                                        alt="Lab Logo"
                                                                                        className="mt-4 w-[150px] h-[50px] object-contain"
                                                                                    />
                                                                                ) : (
                                                                                    <Building2 className="h-6 w-6 text-gray-500" />
                                                                                )}
                                                                            </div>}
                                                                    </div>



                                                                    <div className="space-y-2">
                                                                        <label className="block text-sm font-large text-gray-700">
                                                                            {formData?.name || "N/A"}
                                                                        </label>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="block text-sm font-medium text-gray-700">
                                                                            {formData?.role || "N/A"}
                                                                        </label>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Separator className="my-6 w-full border border-gray-100" />
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-sm font-medium">First Name</Label>
                                                                            <Input
                                                                                name="firstname"
                                                                                value={formData?.firstname}
                                                                                onChange={(e) =>
                                                                                    setFormData((prev) => ({ ...prev, firstname: e.target.value }))
                                                                                }
                                                                                required
                                                                                disabled={!isEditing}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-sm font-medium">Last Name</Label>
                                                                            <Input
                                                                                name="address.state"
                                                                                value={formData?.lastname}
                                                                                onChange={(e) =>
                                                                                    setFormData((prev) => ({ ...prev, lastname: e.target.value }))
                                                                                }
                                                                                required
                                                                                disabled={!isEditing}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2 w-full md:w-1/2">
                                                                        <Label className="text-sm font-medium">Email</Label>
                                                                        <div className="relative">
                                                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                            <Input
                                                                                name="email"
                                                                                value={formData?.email}
                                                                                onChange={(e) =>
                                                                                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                                                                                }
                                                                                required
                                                                                disabled={!isEditing}
                                                                                className="pl-10"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 w-full md:w-1/2">
                                                                        <Label className="text-sm font-medium">Phone</Label>
                                                                        <div className="relative">
                                                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                            <Input
                                                                                name="phone"
                                                                                value={formData?.phone_number}
                                                                                onChange={(e) =>
                                                                                    setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
                                                                                }
                                                                                required
                                                                                disabled={!isEditing}
                                                                                className="pl-10"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </form>
                                        </div>
                                    </div>
                                )}
                                {activeTab === "change-password" && (
                                    <div>
                                        <form onSubmit={handleChangePassword}>
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-4">
                                                </CardHeader>
                                                <CardContent className="mr-20 space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mr-50">
                                                        <Card className="col-span-12">
                                                            <div className="space-y-2 w-full mr-100 md:w-1/2 ml-5 mt-5 mb-10">
                                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                                                    New Password *
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        id="newPassword"
                                                                        type={showPassword ? "text" : "password"}
                                                                        value={passwordData.newPassword}
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
                                                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                                                        ) : (
                                                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 w-full md:w-1/2  ml-5 mb-10">
                                                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                                                    Confirm New Password *
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        id="confirmPassword"
                                                                        type={showConfirmPassword ? "text" : "password"}
                                                                        value={passwordData.confirmPassword}
                                                                        onChange={handlePasswordChange}
                                                                        placeholder="Enter confirm password"
                                                                        required
                                                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                                        className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                                                                    >
                                                                        {showConfirmPassword ? (
                                                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                                                        ) : (
                                                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 w-full md:w-1/2  ml-5 mb-10">
                                                                {error && <p className="text-red-500">{error}</p>}
                                                            </div>
                                                            <div className="space-y-2 w-full md:w-1/2  ml-5 mb-5">
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    type='submit'
                                                                >
                                                                    <Save className="h-4 w-4 mr-2" />
                                                                    Change Password
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
