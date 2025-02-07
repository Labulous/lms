import React, { useState } from "react";
import { changeUserPasswordById } from "@/services/authService"; // Import the function
import { useAuth } from "@/contexts/AuthContext"; // Import authentication context

const ChangePasswordForm: React.FC = () => {
    const { user } = useAuth(); // Get user details from AuthContext
    const userId = user?.id; // Extract user ID
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<{ newPassword: string; confirmPassword: string }>({
        newPassword: "",
        confirmPassword: "",
    });
    const [success, setSuccess] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(""); // Store password strength feedback
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state

    // Function to check password strength
    const checkPasswordStrength = (password: string) => {
        if (!password) return "";

        const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$");
        const mediumRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{6,}$");

        if (strongRegex.test(password)) return "Very Strong";
        if (mediumRegex.test(password)) return "Strong";
        if (password.length >= 6) return "Weak";

        return "Very Weak";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors and success messages before validation
        setError({ newPassword: "", confirmPassword: "" });
        setSuccess("");

        if (!userId) {
            setError({ newPassword: "User not found. Please log in again.", confirmPassword: "" });
            return;
        }

        let isValid = true;
        let newErrors = { newPassword: "", confirmPassword: "" };

        if (!newPassword) {
            newErrors.newPassword = "New password is required.";
            isValid = false;
        } else if (newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters.";
            isValid = false;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirm password is required.";
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
            isValid = false;
        }

        // Set new errors (removes previous errors)
        if (!isValid) {
            setError(newErrors);
            return;
        }

        try {
            await changeUserPasswordById(userId, newPassword);
            setSuccess("Password changed successfully!");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordStrength(""); // Clear password strength indicator
            setError({ newPassword: "", confirmPassword: "" }); // Clear errors on success

            // Show modal after successful password change
            setIsModalVisible(true);
        } catch (err) {
            setError({ newPassword: "Failed to update password. Try again.", confirmPassword: "" });
        }
    };

    const closeModal = () => {
        setIsModalVisible(false);
        window.location.reload(); // Reload the page after closing the modal
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-lg px-8 py-10 bg-white border rounded-md shadow-lg">
                <h2 className="text-3xl font-semibold text-center mb-6">Change Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="new-password" className="block text-lg font-medium text-gray-700">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNewPassword(value);
                                setError((prev) => ({ ...prev, newPassword: "" })); // Remove previous error
                                setPasswordStrength(checkPasswordStrength(value)); // Check password strength
                            }}
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md text-lg"
                        />
                        {passwordStrength && (
                            <p className={`text-sm mt-2 ${passwordStrength === "Very Strong" ? "text-green-500" : passwordStrength === "Strong" ? "text-blue-500" : "text-red-500"}`}>
                                Strength: {passwordStrength}
                            </p>
                        )}
                        {error.newPassword && <p className="text-red-500 text-sm mt-2">{error.newPassword}</p>}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="confirm-password" className="block text-lg font-medium text-gray-700">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setError((prev) => ({ ...prev, confirmPassword: "" })); // Remove previous error
                            }}
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md text-lg"
                        />
                        {error.confirmPassword && <p className="text-red-500 text-sm mt-2">{error.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="w-full py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600">
                        Change Password
                    </button>
                </form>

                {/* Modal */}
                {isModalVisible && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                        <div className="bg-white p-8 rounded-md shadow-lg max-w-sm w-full">
                            <h3 className="text-xl font-semibold mb-4">Password Changed Successfully</h3>
                            <p className="text-sm mb-4">Please log in with your new password.</p>
                            <button
                                onClick={closeModal}
                                className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Close and Reload
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );


    // return (
    //     <div className="flex items-center justify-center h-screen">
    //         <div className="container mx-auto px-4 py-6">
    //             <div className="max-w-md mx-auto p-6 bg-white border rounded-md shadow-md">
    //                 <h2 className="text-2xl font-semibold text-center mb-4">Change Password</h2>
    //                 <form onSubmit={handleSubmit}>
    //                     <div className="mb-4">
    //                         <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
    //                             New Password
    //                         </label>
    //                         <input
    //                             type="password"
    //                             id="new-password"
    //                             value={newPassword}
    //                             onChange={(e) => {
    //                                 const value = e.target.value;
    //                                 setNewPassword(value);
    //                                 setError((prev) => ({ ...prev, newPassword: "" })); // Remove previous error
    //                                 setPasswordStrength(checkPasswordStrength(value)); // Check password strength
    //                             }}
    //                             className="w-full p-2 mt-1 border border-gray-300 rounded-md"
    //                         />
    //                         {passwordStrength && (
    //                             <p className={`text-sm mt-1 ${passwordStrength === "Very Strong" ? "text-green-500" : passwordStrength === "Strong" ? "text-blue-500" : "text-red-500"}`}>
    //                                 Strength: {passwordStrength}
    //                             </p>
    //                         )}
    //                         {error.newPassword && <p className="text-red-500 text-sm mt-1">{error.newPassword}</p>}
    //                     </div>

    //                     <div className="mb-4">
    //                         <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
    //                             Confirm New Password
    //                         </label>
    //                         <input
    //                             type="password"
    //                             id="confirm-password"
    //                             value={confirmPassword}
    //                             onChange={(e) => {
    //                                 setConfirmPassword(e.target.value);
    //                                 setError((prev) => ({ ...prev, confirmPassword: "" })); // Remove previous error
    //                             }}
    //                             className="w-full p-2 mt-1 border border-gray-300 rounded-md"
    //                         />
    //                         {error.confirmPassword && <p className="text-red-500 text-sm mt-1">{error.confirmPassword}</p>}
    //                     </div>

    //                     <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
    //                         Change Password
    //                     </button>
    //                 </form>

    //                 {/* {success && <div className="text-green-500 text-sm mt-4">{success}</div>} */}

    //                 {/* Modal */}
    //                 {isModalVisible && (
    //                     <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
    //                         <div className="bg-white p-6 rounded-md shadow-md max-w-sm w-full">
    //                             <h3 className="text-lg font-semibold mb-4">Password Changed Successfully</h3>
    //                             <p className="text-sm mb-4">Please log in with your new password.</p>
    //                             <button
    //                                 onClick={closeModal}
    //                                 className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
    //                             >
    //                                 Close and Reload
    //                             </button>
    //                         </div>
    //                     </div>
    //                 )}
    //             </div>
    //         </div>
    //     </div>
    // );
};

export default ChangePasswordForm;
