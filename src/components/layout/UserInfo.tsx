import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Lock, LogOut, CircleUserRound } from "lucide-react";
import { logout } from "@/services/authService";

interface UserInfoProps {
    data: {
        name: string;
        email: string;
        role: string;
    } | null;
    children?: React.ReactNode;
}

const UserInfo: React.FC<UserInfoProps> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    const toggleMenu = () => {
        setIsOpen((prev) => !prev);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleProfile = () => {
        navigate("/settings/user-profile");
    };

    const menuItems = [
        { icon: '', label: "Profile", action: handleProfile },
        { icon: '', label: "Logout", action: handleLogout },
    ];

    return (
        <div className="relative inline-block text-left">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700  rounded-md hover:bg-gray-200 focus:outline-none"
            >
                <CircleUserRound className="mr-2" />
                {data?.name ? (
                    data.name
                ) : (
                    <span className="inline-block w-20 h-6 bg-gray-100 rounded-md animate-pulse"></span>
                )}

            </button>
            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                >
                    <div className="py-3 px-4 border-b">
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <CircleUserRound className="mr-2" />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{data?.name}</p>
                                <p className="text-xs text-gray-500   block">{data?.email}</p>
                                <p className="text-m text-black-500  mb-1 block">{data?.role}</p>
                            </div>
                        </div>
                    </div>
                    <div className="py-1">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.action || undefined}
                                className={item.label == "Profile" ? "zflex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:outline-nonedd py-3 px-4 border-b" : "zflex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:outline-nonedd"
                                }                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInfo;
