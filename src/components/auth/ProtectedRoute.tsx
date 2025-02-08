import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { createLogger } from "../../utils/logger";
import { supabase } from "@/lib/supabase";

const logger = createLogger({ module: "ProtectedRoute" });

type Role = "admin" | "technician" | "client" | "super_admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // 🔹 Move useEffect to the top level
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Session check failed:", error);
          return;
        }

        if (!session) {
          logger.debug("No active session found during check");
          return;
        }

        logger.debug("Session check successful", {
          userId: session.user.id,
          expiresAt: session.expires_at,
        });
      } catch (err) {
        logger.error("Error checking session:", err);
      }
    };

    checkSession();
  }, []);
console.log(location.pathname,"location.pathname")
  // 🔹 Show a loading indicator until authentication is determined
  if (authLoading && location.pathname !=="/cases/new" && !location.pathname.includes("/cases/update")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  // 🔹 Redirect to login if no user is authenticated
  if (!user) {
    logger.info("Redirecting to login - no authenticated user", {
      path: location.pathname,
      from: location.state?.from?.pathname || location.pathname,
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🔹 Check role requirements
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
