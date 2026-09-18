import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

import LoadingScreen from "./components/ui/LoadingScreen";

import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import RoleRoute from "./routes/RoleRoute";
import { dashboardRoutes } from "./routes/dashboardRoutes";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#0f172a",
            color: "#ffffff",
            border: "1px solid #334155",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />

        {/*
          Do not wrap the reset page in GuestRoute.
          A valid reset token is the authorization for this flow,
          and an already-authenticated user may still need to use it.
        */}
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route path="/loading" element={<LoadingScreen />} />

        {dashboardRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={route.allowedRoles}>
                  {route.element}
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
