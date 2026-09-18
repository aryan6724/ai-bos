import { Navigate } from "react-router-dom";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../store/AuthContext";

export default function ProtectedRoute({ children }) {
  const {
    isAuthenticated,
    isCheckingAuth,
  } = useAuth();

  // Wait until the existing token/session has been verified.
  // This prevents protected content from flashing before auth is known.
  if (isCheckingAuth) {
    return (
      <LoadingScreen text="Checking secure workspace..." />
    );
  }

  // Never render protected content when authentication is absent.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
