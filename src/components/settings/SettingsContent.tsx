import React from 'react';
import { Button } from "@/components/ui/button";
import { Pencil } from 'lucide-react';
import type { SettingsTab } from './SettingsTabs';

interface SettingsContentProps {
  activeTab: SettingsTab;
}

interface SettingsRow {
  label: string;
  onEdit?: () => void;
}

const ProductCatalogRows: SettingsRow[] = [
  { label: 'Product Type', onEdit: () => console.log('Edit Product Type') },
  { label: 'Product Material', onEdit: () => console.log('Edit Product Material hi') },
];

const CaseWorkflowRows: SettingsRow[] = [
  { label: 'Workstation', onEdit: () => console.log('Edit Workstation') },
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

export const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'system':
        return (
          <div className="p-6 text-gray-600">
            System settings content will go here.
          </div>
        );
      case 'product-catalog':
        return (
          <div className="divide-y border rounded-lg bg-white">
            {ProductCatalogRows.map((row, index) => (
              <SettingsRow key={index} {...row} />
            ))}
          </div>
        );
      case 'case-workflow':
        return (
          <div className="divide-y border rounded-lg bg-white">
            {CaseWorkflowRows.map((row, index) => (
              <SettingsRow key={index} {...row} />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        {activeTab === 'system' && 'System Settings'}
        {activeTab === 'product-catalog' && 'Product Catalog Settings'}
        {activeTab === 'case-workflow' && 'Case Workflow Settings'}
      </h2>
      {renderContent()}
    </div>
  );
};
