import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../services/api";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_TOKEN_LENGTH = 512;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token") || "",
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (
      !token ||
      token.length > MAX_TOKEN_LENGTH ||
      !TOKEN_PATTERN.test(token)
    ) {
      setError("This password reset link is invalid or expired.");
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLoading) return;

    setError("");

    if (
      !token ||
      token.length > MAX_TOKEN_LENGTH ||
      !TOKEN_PATTERN.test(token)
    ) {
      setError("This password reset link is invalid or expired.");
      return;
    }

    if (
      password.length < MIN_PASSWORD_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      // Backend route: app.use("/api/auth", passwordResetRoutes)
      // Route: router.post("/reset", ...)
      await api.post("/auth/reset", {
        token,
        password,
      });

      setPassword("");
      setConfirmPassword("");
      setIsComplete(true);

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch {
      setError("This password reset link is invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been changed successfully. Redirecting you to login..."
      >
        <div
          role="status"
          className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          Password reset completed successfully.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create a new password"
      subtitle="Choose a strong password for your AI-BOS account."
    >
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={MAX_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          disabled={isLoading}
        />

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          maxLength={MAX_PASSWORD_LENGTH}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError("");
          }}
          disabled={isLoading}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full group"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Reset Password"}
          {!isLoading && (
            <ArrowRight
              className="transition group-hover:translate-x-1"
              size={19}
            />
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-400/10 bg-violet-400/5 p-4">
        <LockKeyhole className="mt-0.5 text-violet-300" size={18} />
        <p className="text-xs leading-5 text-slate-400">
          Reset links are short-lived and can be used only once.
        </p>
      </div>

      <p className="mt-7 text-center text-sm text-slate-400">
        Remembered your password?{" "}
        <Link
          to="/login"
          className="font-semibold text-cyan-300 hover:text-cyan-200"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
