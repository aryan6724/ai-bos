import { Navigate } from "react-router-dom";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../store/AuthContext";

const VALID_ROLES = new Set(["admin", "manager", "user"]);

export default function RoleRoute({
  children,
  allowedRoles = [],
}) {
  const { user, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <LoadingScreen text="Checking workspace permissions..." />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route configuration must be an array.
  if (!Array.isArray(allowedRoles)) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  // Every configured role must be a known application role.
  const validConfiguration = allowedRoles.every(
    (role) =>
      typeof role === "string" &&
      VALID_ROLES.has(role)
  );

  if (!validConfiguration) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  // An empty list means the route is available to any authenticated user.
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  return children;
}
