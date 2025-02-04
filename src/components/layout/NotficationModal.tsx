import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPendingApprovals } from "@/services/authService";

interface ApprovalMenuProps {
    children: React.ReactNode;
    onNotificationClick: (id: number) => void; // New prop to handle notification click
}

const PendingApprovalNotification: React.FC<ApprovalMenuProps> = ({ children, onNotificationClick }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

    useEffect(() => {
        const fetchClientPendingApprovals = async () => {
            if (user?.role === "admin" || user?.role === "super_admin") {
                const approvals = await fetchPendingApprovals();
                const pendingApprovals = approvals.filter((approval: any) => approval.status === "pending");
                setPendingApprovals(pendingApprovals);
            }
        };

        fetchClientPendingApprovals();
    }, [user]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pendingApprovals.length > 0 ? (
                    pendingApprovals.map((approval) => (
                        <DropdownMenuItem
                            key={approval.id}
                            className="cursor-pointer flex flex-col items-start"
                            onClick={() => {
                                onNotificationClick(approval.id); // Call the handler
                                navigate('/client-pending-request');
                            }}
                        >
                            <span className="font-semibold">{approval.client_name}</span>
                            <span className="text-sm text-gray-500">
                                {approval.previous_email} → {approval.new_email}
                            </span>
                            <span className="text-xs text-gray-400">
                                Status: {approval.status}
                            </span>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <DropdownMenuItem className="text-gray-500">
                        No pending approvals
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default PendingApprovalNotification;