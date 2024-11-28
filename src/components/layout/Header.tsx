import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserCircle, Bell, Menu, Search, LogOut, Settings } from 'lucide-react';
import { getCurrentUser, logout } from '../../services/authService';
import SettingsMenu from './SettingsMenu';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/cases')) return 'Cases';
    if (path.startsWith('/shipping')) return 'Shipping';
    if (path.startsWith('/clients')) return 'Clients';
    if (path.startsWith('/client-activity')) return 'Client Activity';
    if (path.startsWith('/billing')) return 'Billing';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/inventory')) return 'Inventory';
    return '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none focus:text-gray-600 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 ml-2 md:ml-0">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex-1 max-w-lg px-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for cases or clients..."
                className="w-full py-1.5 pl-8 pr-4 text-sm text-gray-700 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-300"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2.5">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="text-gray-500 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-600">
              <Settings className="h-5 w-5" />
            </button>
            <div className="relative flex items-center">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-600"
              >
                <UserCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{currentUser?.name}</span>
              </button>
              {showSettingsMenu && (
                <SettingsMenu onLogout={handleLogout} />
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;