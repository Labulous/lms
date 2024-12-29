import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { signUp } from "@/services/authService";

interface SettingsRow {
  label: string;
  onEdit?: () => void;
}

const ProductCatalogRows: SettingsRow[] = [
  { label: "Product Type", onEdit: () => console.log("Edit Product Type") },
  {
    label: "Product Material",
    onEdit: () => console.log("Edit Product Material"),
  },
];

const CaseWorkflowRows: SettingsRow[] = [
  { label: "Workstation", onEdit: () => console.log("Edit Workstation") },
];

const SettingsRow: React.FC<SettingsRow> = ({ label, onEdit }) => (
  <div className="flex items-center justify-between py-4 px-6 border-b last:border-b-0">
    <span className="text-sm font-medium text-gray-900">{label}</span>
    {onEdit && (
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="flex items-center gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    )}
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
export const ProductCatalogSettingsContent: React.FC<
  ProductCatalogSettingsContentProps
> = () => {
  return (
    <div className="divide-y border rounded-lg bg-white">
      {ProductCatalogRows.map((row, index) => (
        <SettingsRow key={index} {...row} />
      ))}
    </div>
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
