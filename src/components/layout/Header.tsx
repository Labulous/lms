import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle, Bell, Menu, Search, LogOut, Settings } from "lucide-react";
import { getCurrentUser, logout } from "../../services/authService";
import SettingsMenu from "./SettingsMenu";
import { fetchPendingApprovals } from "../../services/authService";
import PendingApprovalNotification from "./NotficationModal";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [clickedNotifications, setClickedNotifications] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Load clicked notifications from local storage
    const storedClickedNotifications = localStorage.getItem("clickedNotifications");
    if (storedClickedNotifications) {
      const ids = JSON.parse(storedClickedNotifications);
      setClickedNotifications(new Set(ids));
    }
  }, []);

  useEffect(() => {
    const fetchClientPendingApprovals = async () => {
      if (currentUser?.role === "admin" || currentUser?.role === "super_admin") {
        const approvals = await fetchPendingApprovals();
        // Filter out clicked notifications
        const pendingCount = approvals.filter((approval: any) =>
          approval.status === "pending" && !clickedNotifications.has(approval.id)
        ).length;
        setPendingApprovalsCount(pendingCount);
      }
    };

    fetchClientPendingApprovals();
  }, [currentUser, clickedNotifications]);

  const handleNotificationClick = (id: number) => {
    // Update clicked notifications
    setClickedNotifications((prev) => {
      const newClickedNotifications = new Set(prev).add(id);
      // Store in local storage
      localStorage.setItem("clickedNotifications", JSON.stringify(Array.from(newClickedNotifications)));
      return newClickedNotifications;
    });
    // Decrease the count
    setPendingApprovalsCount((prev) => prev - 1);
  };

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

          <div className="flex-1 max-w-lg mx-8">
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

          <div className="flex items-center space-x-3 pr-4">
            {(currentUser?.role === "admin" || currentUser?.role === "super_admin") && (
              <PendingApprovalNotification onNotificationClick={handleNotificationClick}>
                <button className="text-gray-500 hover:text-gray-600 relative">
                  <Bell className="h-5 w-5" />
                  {pendingApprovalsCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center -mt-1 -mr-1">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              </PendingApprovalNotification>
            )}

            <SettingsMenu>
              <button className="text-gray-500 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </SettingsMenu>
            <div className="flex items-center">
              <div className="flex items-center space-x-2 text-gray-500">
                <UserCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{currentUser?.name}</span>
              </div>
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