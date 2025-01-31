import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  Truck,
  Users,
  DollarSign,
  BarChart2,
  PlusCircle,
  Calendar,
  FileText,
  Package,
  Activity,
  ChevronLeft,
  Building2,
  ChevronDown,
  CreditCard,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import logomark from "../../assets/logomark.svg";
import logotext from "../../assets/logotext.svg";
import { supabase } from "@/lib/supabase";
import { labDetail } from "@/types/supabase";
interface MenuItem {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  subItems?: {
    label: string;
    href: string;
    icon: any;
  }[];
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const [labs, setLabs] = useState<labDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!user?.id) return;

    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("labs")
          .select(
            `
            name,
            attachements,
            office_address:office_address!office_address_id (
              address_1,
              address_2,
              city
            )
          `
          )
          .or(
            `super_admin_id.eq.${user?.id},admin_ids.cs.{${user?.id}},technician_ids.cs.{${user?.id}},client_ids.cs.{${user?.id}}`
          );

        if (error) {
          throw new Error(error.message);
        }

        setLabs(data as any);
      } catch (err: any) {
        console.error("Error fetching labs data:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [user?.id]);
  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };
  const menuItems: MenuItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/",
      roles: ["admin", "super_admin", "technician", "client"],
    },
    {
      icon: UserCircle,
      label: "Profile",
      href: "/client-profile",
      roles: ["client"],
    },
    {
      icon: Briefcase,
      label: "Cases",
      href: "/cases",
      roles: ["admin", "super_admin", "technician", "client"],
    },
    {
      icon: Truck,
      label: "Shipping",
      href: "/shipping",
      roles: ["admin", "super_admin"],
    },
    {
      icon: Users,
      label: "Clients",
      href: "/clients",
      roles: ["admin", "super_admin", "technician"],
    },
    {
      icon: DollarSign,
      label: "Billing",
      href: "/billing",
      roles: ["admin", "super_admin"],
      subItems: [
        { label: "Invoices", href: "/billing/invoices", icon: FileText },
        { label: "Payments", href: "/billing/payments", icon: CreditCard },
        { label: "Balance Tracking", href: "/billing/balance", icon: Activity },
        { label: "Statements", href: "/billing/statements", icon: FileText },
        {
          label: "Adjustments",
          href: "/billing/adjustments",
          icon: DollarSign,
        },
      ],
    },
    {
      icon: DollarSign,
      label: "Billing",
      href: "/billing",
      roles: ["client"],
      subItems: [
        { label: "Invoices", href: "/billing/invoices", icon: FileText },
        // { label: "Payments", href: "/billing/payments", icon: CreditCard },
        { label: "Balance Tracking", href: "/billing/balance", icon: Activity },
        {
          label: "Statements",
          href: "/billing/client-statements",
          icon: FileText,
        },
        {
          label: "Adjustments",
          href: "/billing/client-adjustments",
          icon: DollarSign,
        },
      ],
    },
    // {
    //   icon: BarChart2,
    //   label: "Reports",
    //   href: "/reports",
    //   roles: ["admin", "super_admin"],
    // },
    {
      icon: Package,
      label: "Inventory",
      href: "/inventory",
      roles: ["admin", "super_admin"],
    },
  ];

  const quickActions = [
    {
      icon: PlusCircle,
      label: "Create a New Case",
      href: "/cases/new",
      roles: ["super_admin", "admin", "client"],
    },
    {
      icon: Calendar,
      label: "Schedule a Delivery",
      href: "/shipping/new",
      roles: ["admin", "super_admin"],
    },
    {
      icon: Package,
      label: "Add an Inventory Item",
      href: "/inventory/add",
      roles: ["admin", "super_admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );
  const filteredQuickActions = quickActions.filter(
    (action) => user && action.roles.includes(user.role)
  );

  return (
    <aside
      className={`bg-slate-100 text-gray-600 w-56 min-h-screen border-r border-slate-200 flex flex-col transition-all duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-44"
      } md:translate-x-0`}
    >
      <div className="flex items-center justify-between px-4 py-6">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logomark} alt="Labulous Logo" className="h-6 w-6" />
          <img
            src={logotext}
            alt="Labulous"
            className={`h-5 transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0 md:opacity-100"
            }`}
          />
        </Link>
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-600 md:hidden"
        >
          <ChevronLeft
            className={`h-5 w-5 transform transition-transform duration-300 ${
              isOpen ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      <div className="mx-4 mb-6">
        <div
          className="  p-2.5 rounded-lg border border-slate-200 bg-white/50"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {labs[0]?.attachements ? (
            <img
              src={labs[0].attachements}
              alt="Lab Logo"
              className="h-4 w-4 text-gray-500 mt-0.5"
              style={{ width: "50px", height: "30px", objectFit: "contain" }}
            />
          ) : (
            <Building2 className="h-4 w-4 text-gray-500 " />
          )}

          <div
            className={`transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0 md:opacity-100"
            }`}
          >
            <h3 className="font-semibold text-xs text-gray-900">
              {labs[0]?.name}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {labs[0]?.office_address.address_1},
              {labs[0]?.office_address?.city}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              item.subItems?.some(
                (subItem) => location.pathname === subItem.href
              );
            const isOpen = openDropdowns.includes(item.label);

            // If the item has subItems, render as a dropdown
            if (item.subItems) {
              return (
                <div key={item.href}>
                  <div
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600"
                    }`}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`flex-1 transition-opacity duration-200 ${
                        isOpen ? "opacity-100" : "opacity-0 md:opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          to={subItem.href}
                          className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                            location.pathname === subItem.href
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-500 hover:bg-blue-50/50 hover:text-blue-600"
                          }`}
                        >
                          <subItem.icon
                            className={`h-5 w-5 flex-shrink-0 ${
                              location.pathname === subItem.href
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          />
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // For items without subItems, render as a regular Link
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600"
                }`}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                />
                <span
                  className={`transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "opacity-0 md:opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <h3
            className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0 md:opacity-100"
            }`}
          >
            Quick Actions
          </h3>
          <div className="space-y-1">
            {filteredQuickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === action.href
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600"
                }`}
              >
                <action.icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    location.pathname === action.href
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "opacity-0 md:opacity-100"
                  }`}
                >
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
