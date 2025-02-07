import React, { useState, useEffect, useMemo } from "react";

import { supabase } from "../../lib/supabase";
import { Database, Materials } from "../../types/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { Pencil, Plus } from "lucide-react";
import { AddProductValuesDialog } from "@/components/settings/AddProductValuesDialog";
import EditProductValuesDialog from "@/components/settings/EditProductValuesDialog";
import { handleSetDefaultMaterials } from "@/lib/defaultMaterials";

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
interface SettingsRow {
  label: string;
  actions?: JSX.Element;
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
  const [isLoading, setLoading] = useState<boolean>(true);
  const [disableDefaultInsert, setDisabledDefaultButton] =
    useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<
    "product_types" | "materials" | null
  >(null);
  const [openEditDialog, setOpenEditDialog] = useState<
    "product_types" | "materials" | null
  >(null);

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
      ? supabase.from("services").select(
          `
        *,
        material:materials(name)
      `
        )
      : //.eq("lab_id", labIdData?.lab_id)
        null,
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
          .eq("lab_id", labIdData.lab_id)
      : //.eq("lab_id", labIdData?.lab_id)
        null,
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
      setLoading(false);
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
  const handleOpenDialog = (type: "product_types" | "materials") => {
    setOpenEditDialog(null); // Close edit dialog if open
    setOpenDialog(type);
  };
  const handleOpenEditDialog = (type: "product_types" | "materials") => {
    setOpenDialog(null); // Close add dialog if open
    setOpenEditDialog(type);
  };
  const ProductCatalogRows: SettingsRow[] = [
    {
      label: "Product Material",
      actions: (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleOpenDialog("materials")}>
            <span className="flex gap-2">
              <Plus className="h-4 w-4" />
              Add Material
            </span>
          </Button>
          <Button size="sm" onClick={() => handleOpenEditDialog("materials")}>
            <span className="flex gap-2">
              <Pencil className="h-4 w-4" />
              Edit Material
            </span>
          </Button>
        </div>
      ),
    },
  ];
  const SettingsRow: React.FC<SettingsRow> = ({ label, actions }) => (
    <div className="flex items-center justify-between py-4 px-6 border-b last:border-b-0">
      {actions}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center">
        <PageHeader
          heading="Products & Services"
          description="Manage your product catalog and service offerings."
        />
        <div className="divide-y border rounded-lg bg-white">
          {materialsData.length === 0 && !isLoading && labIdData?.lab_id ? (
            <div>
              <Button
                disabled={disableDefaultInsert}
                onClick={() => {
                  setDisabledDefaultButton(true);
                  handleSetDefaultMaterials();
                }}
              >
                <span className="text-sm font-medium flex gap-2">
                  {"Set Default Materials"}
                  <Plus className="h-4 w-4" />
                </span>
              </Button>
            </div>
          ) : (
            <>
              {ProductCatalogRows.map((row, index) => (
                <SettingsRow key={index} {...row} />
              ))}
            </>
          )}
        </div>
      </div>
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
      </div>

      <AddProductValuesDialog
        open={openDialog === "materials"}
        onOpenChange={(open: boolean) => !open && setOpenDialog(null)}
        type="materials"
        labId={labIdData?.lab_id}
      />
      <EditProductValuesDialog
        open={openEditDialog === "materials"}
        onOpenChange={(open: boolean) => !open && setOpenEditDialog(null)}
        title="Materials"
        type="materials"
        labId={labIdData?.lab_id}
      />
    </div>
  );
};

export default MaterialSelection;
