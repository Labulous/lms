import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { createLogger } from "../../utils/logger";

const logger = createLogger({ module: "ProtectedRoute" });

type Role = "admin" | "technician" | "client" | "super_admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    logger.info("Redirecting to login - no authenticated user", {
      path: location.pathname,
      from: location.state?.from?.pathname || location.pathname,
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = user?.role as Role;

    if (!roles.includes(userRole) && userRole !== "admin") {
      logger.warn("Insufficient role for access", {
        userRole,
        requiredRole,
        path: location.pathname,
        userId: user?.id,
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  logger.debug("Access granted", {
    userId: user?.id,
    userRole: user?.role,
    requiredRole,
    path: location.pathname,
  });

  return <>{children}</>;
};

export default ProtectedRoute;
