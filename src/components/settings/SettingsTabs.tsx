import React from 'react';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

export type SettingsTab = 'system' | 'product-catalog' | 'case-workflow';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs = [
  { id: 'system', label: 'System', href: '/settings/system' },
  { id: 'product-catalog', label: 'Product Catalog', href: '/settings/product-catalog' },
  { id: 'case-workflow', label: 'Case Workflow', href: '/settings/case-workflow' },
] as const;

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();

  const handleTabClick = (tab: SettingsTab, href: string) => {
    onTabChange(tab);
    navigate(href);
  };

  return (
    <div className="w-64 border-r min-h-[calc(100vh-4rem)] bg-white">
      <nav className="p-4">
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => handleTabClick(tab.id, tab.href)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-gray-100 hover:text-gray-900",
                  activeTab === tab.id
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600"
                )}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
