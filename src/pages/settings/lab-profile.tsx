
import { SettingsTabs } from './SettingsTabs';
import { CaseWorkflowSettingsContent } from './SettingsContent';
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from '@/components/layout/Layout';
import { labDetail, OfficeAddress } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Building, Mail, MapPin, Pencil, Phone, Save, Upload, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { eachMonthOfInterval } from 'date-fns';
import { uploadFile } from '@/lib/fileUploads';
import { useLocation, useNavigate } from 'react-router-dom';

interface LabProfileFormData {
    name: string,
    attachements?: string,
    id?: string;
    office_address_id?: string,
    office_address: OfficeAddress;
    file: File | null
}

export const LABProfile: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState<LabProfileFormData>({
        id: "",
        name: "",
        attachements: "",
        office_address_id: "",
        file: null,
        office_address: {
            address_1: "",
            address_2: "",
            city: "",
            state_province: "",
            zip_postal: "",
            country: "",
            phone_number: "",
            email: "",
        },
    });

    const fetchLabs = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from("labs")
                .select(
                    `
        
        id,
        name,
        attachements,
        office_address_id,
        office_address:office_address!office_address_id (            
          email,             
          phone_number,
          address_1,
          address_2,
          city,
          state_province,
          zip_postal,
          country
        )
      `
                )
                .or(
                    `super_admin_id.eq.${user?.id},admin_ids.cs.{${user?.id}},technician_ids.cs.{${user?.id}},client_ids.cs.{${user?.id}}`
                );

            if (error) {
                throw new Error(error.message);
            }

            setFormData(data[0] as any);
        } catch (err: any) {
            console.error("Error fetching labs data:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.id) return;
        fetchLabs();

    }, [user?.id]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        debugger;
        if (!formData) return;
        console.log(formData);

        setLoading(true);
        e.preventDefault();

        try {
            if (isEditing) {
                debugger;
                let publicUrlData = null;
                if (formData.file) {
                    const fileName = `${Date.now()}_${formData.file?.name}`;
                    console.log(fileName);
                    const { data: logodata, error: logoerror } = await supabase.storage
                        .from(`lab-logo`)
                        .upload(fileName, formData?.file as File, {
                            cacheControl: "3600",
                            upsert: false,
                        });

                    if (logoerror) {
                        console.log('logo error-----', logoerror);
                        throw logoerror;
                    }

                    // Get the public URL for the uploaded file
                    const { data: publicUrlResponse } = supabase.storage
                        .from("lab-logo")
                        .getPublicUrl(fileName);

                    if (!publicUrlResponse) {
                        throw new Error("Failed to retrieve public URL");
                    }
                    publicUrlData = publicUrlResponse.publicUrl;;
                }


                const { error } = await supabase
                    .from("labs")
                    .update({
                        name: formData.name,
                        attachements: formData.file ? publicUrlData : formData.attachements ? formData.attachements : "",
                    })
                    .eq("id", formData.id);

                if (error) throw error;

                const { data, error: updateAddressError } =
                    await supabase
                        .from("office_address")
                        .update({
                            address_1: formData.office_address?.address_1,
                            address_2: formData.office_address?.address_2 || null,
                            city: formData.office_address?.city,
                            state_province: formData.office_address?.state_province,
                            zip_postal: formData.office_address.zip_postal,
                            country: formData.office_address.country,
                            phone_number: formData.office_address.phone_number,
                            email: formData.office_address.email,
                        })
                        .eq("id", formData.office_address_id);



                toast.success("Lab updated successfully");
                setLoading(false);
                setIsEditing(false);
            }

            fetchLabs();
            setLoading(false);
            navigate(`${location.pathname}?reload=${new Date().getTime()}`, { replace: true });
            //window.location.reload();
        } catch (error) {
            console.error("Error updating lab:", error);
            console.log("Error updating lab:", error);
            toast.error("Failed to update lab");
            setLoading(false);
        }
    };



    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debugger;
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
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
            <SettingsTabs />
            <div className="flex-1 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Lab Profile
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Basic Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">

                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Logo</Label>
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
                                                            <div className="space-y-4">
                                                                <div className="flex justify-center space-x-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={triggerFileInput}
                                                                        className="inline-flex items-center px-1 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                    >
                                                                        <Upload className="h-2 w-5 mr-2" />
                                                                        Upload Files
                                                                    </button>
                                                                </div>
                                                                <p className="text-sm text-gray-500">
                                                                    Click the button above to select lab logo
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {formData.file && (
                                                            <p className="mt-2 text-sm text-gray-600">
                                                                Uploaded file: <strong>{formData.file.name}</strong>
                                                            </p>
                                                        )}
                                                    </div> :
                                                    <div>
                                                        {formData?.attachements && formData?.attachements.length > 0 && (
                                                            <img
                                                                src={
                                                                    formData?.attachements
                                                                        ? formData.attachements
                                                                        : ""
                                                                }
                                                                alt="Lab Logo"
                                                                className="mt-4"
                                                                style={{ width: "150px", height: "30px", objectFit: "contain" }}
                                                            />
                                                        )}
                                                    </div>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Name</Label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="clientName"
                                                        value={formData.name}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                name: e.target.value,
                                                            }));
                                                        }}
                                                        required
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
                                                        value={formData.office_address.email}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    email: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
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
                                                        value={formData.office_address.phone_number}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    phone_number: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
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
                                                <Label className="text-sm font-medium">Address1</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="address.address_1"
                                                        value={formData.office_address.address_1}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    address_1: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
                                                        disabled={!isEditing}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Address2</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        name="address.address_2"
                                                        value={formData.office_address.address_2}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    address_2: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        disabled={!isEditing}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">City</Label>
                                                    <Input
                                                        name="address.city"
                                                        value={formData.office_address.city}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    city: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">State</Label>
                                                    <Input
                                                        name="address.state"
                                                        value={formData.office_address.state_province}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    state_province: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Country</Label>
                                                    <Input
                                                        name="address.country"
                                                        value={formData.office_address.country}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    country: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Zip Code</Label>
                                                    <Input
                                                        name="address.zipCode"
                                                        value={formData.office_address.zip_postal}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                office_address: {
                                                                    ...prev.office_address,
                                                                    zip_postal: e.target.value,
                                                                },
                                                            }));
                                                        }}
                                                        required
                                                        disabled={!isEditing}
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
        </div>
        </Layout>
    );
};
