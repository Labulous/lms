import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle, Bell, Menu, Settings } from "lucide-react";
import { getCurrentUser, logout } from "../../services/authService";
import SettingsMenu from "./SettingsMenu";
import UserInfo from "./UserInfo";
import SearchBar from "../search/SearchBar";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path.startsWith("/cases")) return "Cases";
    if (path.startsWith("/shipping")) return "Shipping";
    if (path.startsWith("/clients")) return "Clients";
    if (path.startsWith("/billing")) return "Billing";
    if (path.startsWith("/reports")) return "Reports";
    if (path.startsWith("/inventory")) return "Inventory";
    return "";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="w-full">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center pl-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 focus:outline-none focus:text-gray-600 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 ml-2 md:ml-0">
              {getPageTitle()}
            </h1>
          </div>

          {currentUser?.id && <SearchBar userId={currentUser.id} />}

          <div className="flex items-center space-x-3 pr-4">
            <button className="text-gray-500 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </button>
            <SettingsMenu>
              <button className="text-gray-500 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </SettingsMenu>
            <div className="flex items-center">
              <UserInfo data={currentUser}>
                <div className="flex items-center space-x-2 text-gray-500">
                  <UserCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{currentUser?.name}</span>
                </div>
              </UserInfo>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
