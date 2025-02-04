import React, { useState, useEffect, useMemo } from "react";

import { supabase } from "../../lib/supabase";
import { Database, Materials } from "../../types/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

export interface ServicesFormData {
    categories: string[];
    price_error?: string;
    category_error?: string;
    name: string;
    price: number;
    is_client_visible: boolean;
    is_taxable: boolean;
    discount?: number;
    description?: string;
    material_id?: string;
}

type Product = Database["public"]["Tables"]["products"]["Row"] & {
    material: { name: string } | null;
    product_type: { name: string } | null;
    billing_type: { name: string; label: string | null } | null;
};

type ProductType = Database["public"]["Tables"]["product_types"]["Row"];

type ServiceBase = {
    name: string;
    description: string;
    price: number;
    is_client_visible: boolean;
    is_taxable: boolean;
    material_id?: string;
    lab_id: string;
    material?: { name: string } | null;
};

type Service = ServiceBase & {
    id: string;
    created_at: string;
    updated_at: string;
};

interface SortConfig {
    key: keyof Service;
    direction: "asc" | "desc";
}

const MaterialSelection: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [materialsData, setMaterials] = useState<Materials[]>([]);
    const navigate = useNavigate();

    const { user } = useAuth();

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

    const { data: products1, error: caseError } = useQuery(
        labIdData?.lab_id
            ? supabase
                .from("products")
                .select(
                    `
    *,
    material:materials(name),
    product_type:product_types(name),
    billing_type:billing_types(name, label)
  `
                )
                .order("name")
                .eq("lab_id", labIdData?.lab_id)
            : null,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            refreshInterval: 5000,
        }
    );

    const { data: servicesApi, error: servicesApiError } = useQuery(
        labIdData?.lab_id
            ? supabase
                .from("services")
                .select(
                    `
        *,
        material:materials(name)
      `
                )
                .eq("lab_id", labIdData?.lab_id)
            : null,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            refreshInterval: 5000,
        }
    );

    const { data: materialsApi, error: materialsError } = useQuery(
        labIdData?.lab_id
            ? supabase
                .from("materials")
                .select(
                    `
           *
          `
                )
                .eq("lab_id", labIdData?.lab_id)
            : null,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            refreshInterval: 5000,
        }
    );

    useEffect(() => {
        if (products1) {
            setProducts(products1 as any[]);
        }
        if (servicesApi) {
            setServices(servicesApi);
        }
        if (materialsApi) {
            setMaterials(materialsApi);
        }
    }, [products1, servicesApi, materialsApi]);

    const handleShowProducts = (materialName: string) => {

        console.log(materialName);
        navigate(`/products-services/products&${materialName}`);

    };

    const handleShowServices = (materialName: string) => {
        console.log(materialName);
        navigate(`/products-services/services&${materialName}`);
    };

    return (
        <div className="container mx-auto px-4 py-4">
            <PageHeader
                heading="Products & Services"
                description="Manage your product catalog and service offerings."
            />
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Materials</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materialsData.map((material) => (
                        <div key={material.id} className="border p-4 rounded-md">
                            <h3 className="text-md font-medium">{material.name}</h3>
                            <div className="flex space-x-2 mt-2">
                                <Button onClick={() => handleShowProducts(material.name)}>
                                    Show Products
                                </Button>
                                <Button onClick={() => handleShowServices(material.name)}>
                                    Show Services
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div >
        </div >
    );
};


export default MaterialSelection;