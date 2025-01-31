import React from "react";
import { X } from "lucide-react";  // Import the cross icon from lucide-react

interface ModalProps {
    pendingApprovals: any[]; // Expecting an array of pending approvals
    onApprove: (approvalId: string, clientId: string, userId: string, newEmail: string) => void;
    onDeny: (approvalId: string, clientId: string, userId: string, newEmail: string) => void;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ pendingApprovals, onApprove, onDeny, onClose }) => {
    // Filter the pending approvals where the status is "pending"
    const filteredApprovals = pendingApprovals.filter((approval) => approval.status === "pending");

    return (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-gray-500 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
                {/* Cross icon to close the modal */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
                {filteredApprovals.length > 0 ? (
                    <div>
                        {filteredApprovals.map((approval) => (
                            <div key={approval.id} className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-medium">{approval.client_name}</p>
                                    <p className="text-sm text-gray-600">
                                        {`Request to change email from `}
                                        <strong>{approval.previous_email}</strong>
                                        {` to `}
                                        <strong>{approval.new_email}</strong>
                                    </p>
                                </div>
                                <div className="space-x-3">
                                    <button
                                        onClick={() => onApprove(approval.id, approval.client_id, approval.user_id, approval.new_email)}
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onDeny(approval.id, approval.client_id, approval.user_id, approval.new_email)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg"
                                    >
                                        Deny
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No pending approvals at the moment.</p>
                )}
            </div>
        </div>
    );
};

export default Modal;
