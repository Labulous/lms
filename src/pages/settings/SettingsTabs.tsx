import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";

export type SettingsTab = 'system' | 'product-catalog' | 'case-workflow' | 'working-tags';

const tabs = [
  { id: 'system', label: 'System', href: '/settings/system' },
  { id: 'product-catalog', label: 'Product Catalog', href: '/settings/product-catalog' },
  { id: 'case-workflow', label: 'Case Workflow', href: '/settings/case-workflow' },
  { id: 'working-tags', label: 'Working Tags', href: '/settings/working-tags' },
  { id: 'working-Pans', label: 'Working Pans', href: '/settings/working-pans' },  
  { id: 'user-management', label: 'User Management', href: '/settings/user-management' },
] as const;

export const SettingsTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = tabs.find(tab => location.pathname === tab.href)?.id || 'system';

  return (
    <div className="w-64 border-r min-h-[calc(100vh-4rem)] bg-white">
      <nav className="p-4">
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => navigate(tab.href)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-gray-100 hover:text-gray-900",
                  currentTab === tab.id
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
