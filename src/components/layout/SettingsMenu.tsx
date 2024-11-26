import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Package, Users, CreditCard, Database } from 'lucide-react';

interface SettingsMenuProps {
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Package, label: 'Products & Services', href: '/settings/products' },
    { icon: Users, label: 'User Management', href: '/settings/users' },
    { icon: CreditCard, label: 'Billing Settings', href: '/settings/billing' },
    { icon: Database, label: 'System Settings', href: '/settings/system' },
  ];

  const handleClick = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <div 
      className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
          Settings
        </div>
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(item.href)}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
            role="menuitem"
          >
            <item.icon className="mr-3 h-5 w-5 text-gray-500" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsMenu;