import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Truck, Users, DollarSign, BarChart2, PlusCircle, Calendar, FileText, Package, Activity, ChevronLeft, Building2, ChevronDown, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logomark from '../../assets/logomark.svg';
import logotext from '../../assets/logotext.svg';

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

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const menuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', href: '/', roles: ['admin', 'technician', 'client'] },
    { icon: Briefcase, label: 'Cases', href: '/cases', roles: ['admin', 'technician'] },
    { icon: Truck, label: 'Shipping', href: '/shipping', roles: ['admin'] },
    { icon: Users, label: 'Clients', href: '/clients', roles: ['admin', 'technician'] },
    { icon: Activity, label: 'Client Activity', href: '/client-activity', roles: ['admin'] },
    { 
      icon: DollarSign, 
      label: 'Billing', 
      href: '/billing',
      roles: ['admin'],
      subItems: [
        { label: 'Invoices', href: '/billing/invoices', icon: FileText },
        { label: 'Payments', href: '/billing/payments', icon: CreditCard },
        { label: 'Balance Tracking', href: '/billing/balance', icon: Activity },
        { label: 'Statements', href: '/billing/statements', icon: FileText },
        { label: 'Adjustments', href: '/billing/adjustments', icon: DollarSign }
      ]
    },
    { icon: BarChart2, label: 'Reports', href: '/reports', roles: ['admin'] },
    { icon: Package, label: 'Inventory', href: '/inventory', roles: ['admin'] },
  ];

  const quickActions = [
    { icon: PlusCircle, label: 'Create a New Case', href: '/cases/new', roles: ['admin', 'client'] },
    { icon: Calendar, label: 'Schedule a Delivery', href: '/shipping/new', roles: ['admin'] },
    { icon: FileText, label: 'Generate an Invoice', href: '/invoices/new', roles: ['admin'] },
    { icon: Package, label: 'Add an Inventory Item', href: '/inventory/add', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));
  const filteredQuickActions = quickActions.filter(action => user && action.roles.includes(user.role));

  return (
    <aside className={`bg-slate-100 text-gray-600 w-56 min-h-screen border-r border-slate-200 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-44'} md:translate-x-0`}>
      <div className="flex items-center justify-between px-4 py-6">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logomark} alt="Labulous Logo" className="h-6 w-6" />
          <img 
            src={logotext} 
            alt="Labulous" 
            className={`h-5 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
          />
        </Link>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-600 md:hidden">
          <ChevronLeft className={`h-5 w-5 transform transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <div className="mx-4 mb-6">
        <div className="flex items-start space-x-2.5 p-2.5 rounded-lg border border-slate-200 bg-white/50">
          <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
          <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            <h3 className="font-semibold text-xs text-gray-900">Solaris Dental Design</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">17 Fawcett Rd, Coquitlam</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.subItems?.some(subItem => location.pathname === subItem.href));
            const isOpen = openDropdowns.includes(item.label);

            // If the item has subItems, render as a dropdown
            if (item.subItems) {
              return (
                <div key={item.href}>
                  <div
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-600'
                    }`}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className={`flex-1 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                      {item.label}
                    </span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
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
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-500 hover:bg-blue-50/50 hover:text-blue-600'
                          }`}
                        >
                          <subItem.icon className={`h-5 w-5 flex-shrink-0 ${location.pathname === subItem.href ? 'text-blue-600' : 'text-gray-500'}`} />
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
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-600'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            Quick Actions
          </h3>
          <div className="space-y-1">
            {filteredQuickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === action.href
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-600'
                }`}
              >
                <action.icon className={`h-5 w-5 flex-shrink-0 ${location.pathname === action.href ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
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