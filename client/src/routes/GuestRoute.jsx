import { Navigate } from "react-router-dom";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../store/AuthContext";

export default function GuestRoute({ children }) {
  const {
    isAuthenticated,
    isCheckingAuth,
  } = useAuth();

  if (isCheckingAuth) {
    return (
      <LoadingScreen text="Checking session..." />
    );
  }

  if (isAuthenticated) {
    // Always use a fixed internal destination for authenticated guests.
    // This prevents an external return URL from becoming an open redirect.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
