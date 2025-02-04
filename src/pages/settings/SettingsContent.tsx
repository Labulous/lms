import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { signUp } from "@/services/authService";
import WorkingTagsSettings from "./working-tags";
import WorkingPansSettings from "./working-pans";
import { AddProductValuesDialog } from "@/components/settings/AddProductValuesDialog";
import EditProductValuesDialog from "@/components/settings/EditProductValuesDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";
import TaxConfiguration from "@/components/settings/TaxConfiguration";

interface SettingsRow {
  label: string;
  actions?: JSX.Element;
}

const ProductCatalogRows: SettingsRow[] = [
  {
    label: "Product Type",
    actions: (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("Add Product Type")}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("Edit Product Type")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
  {
    label: "Product Material",
    actions: (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("Add Product Material")}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("Edit Product Material")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

const CaseWorkflowRows: SettingsRow[] = [
  {
    label: "Workstation",
    actions: (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("Add Workstation")}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("Edit Workstation")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

const SettingsRow: React.FC<SettingsRow> = ({ label, actions }) => (
  <div className="flex items-center justify-between py-4 px-6 border-b last:border-b-0">
    <span className="text-sm font-medium text-gray-900">{label}</span>
    {actions}
  </div>
);

interface SystemSettingsContentProps {}
export const SystemSettingsContent: React.FC<
  SystemSettingsContentProps
> = () => {
  const [email, setEmail] = useState("zahidtest.5@gmail.com");
  const [password, setPassword] = useState("pass.5");
  const [name, setName] = useState("zahid hussain test 5");
  const handleSignUp = async () => {
    const role: "super_admin" = "super_admin"; // Static role for this example
    await signUp(email, password, name, role);
  };
  return (
    <div className="p-6 text-gray-600">
      System settings content will go here.
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
};

interface ProductCatalogSettingsContentProps {}
export const ProductCatalogSettingsContent: React.FC<ProductCatalogSettingsContentProps> = () => {
  const [openDialog, setOpenDialog] = useState<"product_types" | "materials" | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<"product_types" | "materials" | null>(null);
  const [labId, setLabId] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchLabId = async () => {
      if (user?.id) {
        const data = await getLabIdByUserId(user.id);
        if (data?.labId) {
          setLabId(data.labId);
        }
      }
    };
    fetchLabId();
  }, [user]);

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
      label: "Product Type",
      actions: (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog("product_types")}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditDialog("product_types")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      label: "Product Material",
      actions: (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog("materials")}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditDialog("materials")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="divide-y border rounded-lg bg-white">
          {ProductCatalogRows.map((row, index) => (
            <SettingsRow key={index} {...row} />
          ))}
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => handleOpenDialog("product_types")}
          >
            Add New Product Type
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenDialog("materials")}
          >
            Add New Material
          </Button>
        </div>
      </div>

      <AddProductValuesDialog
        open={openDialog === "product_types"}
        onOpenChange={(open: boolean) => !open && setOpenDialog(null)}
        type="product_types"
        labId={labId}
      />

      <AddProductValuesDialog
        open={openDialog === "materials"}
        onOpenChange={(open: boolean) => !open && setOpenDialog(null)}
        type="materials"
        labId={labId}
      />

      <EditProductValuesDialog
        open={openEditDialog === "product_types"}
        onOpenChange={(open: boolean) => !open && setOpenEditDialog(null)}
        title="Product Types"
        type="product_types"
        labId={labId}
      />

      <EditProductValuesDialog
        open={openEditDialog === "materials"}
        onOpenChange={(open: boolean) => !open && setOpenEditDialog(null)}
        title="Materials"
        type="materials"
        labId={labId}
      />
    </>
  );
};

interface CaseWorkflowSettingsContentProps {}
export const CaseWorkflowSettingsContent: React.FC<
  CaseWorkflowSettingsContentProps
> = () => {
  return (
    <div className="divide-y border rounded-lg bg-white">
      {CaseWorkflowRows.map((row, index) => (
        <SettingsRow key={index} {...row} />
      ))}
    </div>
  );
};

export const WorkingTagsSettingsContent: React.FC = () => {
  return (
    <div className="p-6">
      <WorkingTagsSettings />
    </div>
  );
};

export const WorkingPansSettingsContent: React.FC = () => {
  return (
    <div className="p-6">
      <WorkingPansSettings />
    </div>
  );
};

export const TaxConfigurationSettingsContent: React.FC = () => {
  const [labId, setLabId] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchLabId = async () => {
      if (user?.id) {
        const data = await getLabIdByUserId(user.id);
        if (data?.labId) {
          setLabId(data.labId);
        }
      }
    };
    fetchLabId();
  }, [user]);

  return (
    <div className="p-6">
      <TaxConfiguration labId={labId} />
    </div>
  );
};
