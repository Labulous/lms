import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { fetchPendingApprovals, approvePendingApproval } from "@/services/authService";
import { getCurrentUser } from "@/services/authService";
import { denyPendingApproval } from "@/services/authService";

const ClientPendingRequest: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [loading, setLoading] = useState(true); // Loading state to track data fetching

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        };
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const fetchClientPendingApprovals = async () => {
            setLoading(true); // Start loading when fetching data
            const approvals = await fetchPendingApprovals();
            setPendingApprovals(approvals);
            setLoading(false); // Stop loading after data is fetched
        };
        fetchClientPendingApprovals();
    }, [currentUser]);

    const handleApprove = async (approvalId: string, clientId: string, userId: string, newEmail: string) => {
        try {
            const response = await approvePendingApproval(approvalId, clientId, userId, newEmail);
            if (response.success) {
                setModalMessage("Client email has been successfully approved.");
                setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
            } else {
                setModalMessage("Failed to approve the request.");
            }
        } catch (error) {
            setModalMessage("Error handling the approval action.");
        } finally {
            setModalOpen(true);
        }
    };

    const handleDeny = async (approvalId: string, clientId: string, userId: string, newEmail: string) => {
        try {
            const response = await denyPendingApproval(approvalId, clientId, userId, newEmail);
            if (response.success) {
                setModalMessage("Client email request has been successfully denied.");
                setPendingApprovals(prev => prev.filter(a => a.id !== approvalId)); // Remove the denied approval from the list
            } else {
                setModalMessage("Failed to deny the request.");
            }
        } catch (error) {
            setModalMessage("Error handling the deny action.");
        } finally {
            setModalOpen(true); // Open the modal to show the message
        }
    };

    const filteredApprovals = pendingApprovals.filter((approval) => approval.status === "pending");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mt-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-xl font-semibold justify-center">Client Pending Request</CardTitle>
                        </CardHeader>
                        {filteredApprovals.length > 0 ? (
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredApprovals.map((approval) => (
                                        <Card key={approval.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{approval.client_name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    {`Request to change email from `}
                                                    <strong>{approval.previous_email}</strong>
                                                    {` to `}
                                                    <strong>{approval.new_email}</strong>
                                                </div>
                                                <div className="space-x-3">
                                                    <button
                                                        onClick={() => handleApprove(approval.id, approval.client_id, approval.user_id, approval.new_email)}
                                                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeny(approval.id, approval.client_id, approval.user_id, approval.new_email)}
                                                        className="bg-red-500 text-white px-4 py-2 rounded-lg"
                                                    >
                                                        Deny
                                                    </button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        ) : (
                            <p className="text-center">No pending approvals at the moment.</p>
                        )}
                    </Card>
                </div>
            </div>

            {/* Action Status Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Action Status</DialogTitle>
                    </DialogHeader>
                    <p>{modalMessage}</p>
                    <DialogClose asChild>
                        <Button className="mt-4" onClick={() => setModalOpen(false)}>Close</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ClientPendingRequest;
