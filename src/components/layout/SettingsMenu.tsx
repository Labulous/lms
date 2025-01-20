import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Users, CreditCard, Database } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface SettingsMenuProps {
  children: React.ReactNode;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ children }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Package, label: "Products & Services", href: "/products-services" },
    { icon: Users, label: "User Management", href: "/settings/users" },
    { icon: CreditCard, label: "Billing Settings", href: "/settings/billing" },
    { icon: Database, label: "System Settings", href: "/settings/system" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => navigate(item.href)}
            className="cursor-pointer"
          >
            <item.icon className="mr-3 h-5 w-5 text-gray-500" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsMenu;
