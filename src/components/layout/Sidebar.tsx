import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Truck, Users, DollarSign, BarChart2, PlusCircle, Calendar, FileText, Package, Activity } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const currentUser = getCurrentUser();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/', roles: ['admin', 'technician', 'client'] },
    { icon: Briefcase, label: 'Cases', href: '/cases', roles: ['admin', 'technician'] },
    { icon: Truck, label: 'Shipping', href: '/shipping', roles: ['admin'], notification: 3 },
    { icon: Users, label: 'Clients', href: '/clients', roles: ['admin'] },
    { icon: Activity, label: 'Client Activity', href: '/client-activity', roles: ['admin'] },
    { icon: DollarSign, label: 'Billing', href: '/billing', roles: ['admin'] },
    { icon: BarChart2, label: 'Reports', href: '/reports', roles: ['admin'] },
    { icon: Package, label: 'Inventory', href: '/inventory', roles: ['admin'] },
  ];

  const quickActions = [
    { icon: PlusCircle, label: 'Create a New Case', href: '/cases/new', roles: ['admin', 'client'] },
    { icon: Calendar, label: 'Schedule a Delivery', href: '/shipping/new', roles: ['admin'] },
    { icon: FileText, label: 'Generate an Invoice', href: '/billing/new', roles: ['admin'] },
    { icon: Package, label: 'Add an Inventory Item', href: '/inventory/add', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser?.role || ''));
  const filteredQuickActions = quickActions.filter(action => action.roles.includes(currentUser?.role || ''));

  return (
    <aside className={`bg-gray-800 text-white w-56 min-h-screen p-4 ${isOpen ? 'block' : 'hidden'} md:block`}>
      <nav>
        <ul>
          {filteredMenuItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link 
                to={item.href} 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${location.pathname === item.href ? 'bg-gray-700' : ''}`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="text-sm">{item.label}</span>
                {item.notification && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px] min-h-[20px]">
                    {item.notification}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {filteredQuickActions.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h3>
          <ul>
            {filteredQuickActions.map((action) => (
              <li key={action.href} className="mb-2">
                <Link 
                  to={action.href} 
                  className="flex items-center p-2 rounded hover:bg-gray-700 text-sm"
                >
                  <action.icon className="h-5 w-5 mr-3" />
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;