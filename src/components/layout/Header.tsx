import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, Bell, Menu, Search, LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../../services/authService';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none focus:text-gray-600 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="text-2xl font-bold text-gray-800 ml-2 md:ml-0">
              Labulous
            </Link>
          </div>
          <div className="flex-1 max-w-2xl px-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for cases or clients..."
                className="w-full py-2 pl-10 pr-4 text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:bg-white focus:shadow-outline text-sm"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-800">
              <Bell className="h-6 w-6" />
            </button>
            <div className="relative">
              <button className="flex items-center text-gray-600 hover:text-gray-800">
                <UserCircle className="h-6 w-6 mr-2" />
                <span className="text-sm font-medium">{currentUser?.name}</span>
              </button>
            </div>
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-800">
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;