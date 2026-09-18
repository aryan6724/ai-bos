import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../services/api";

const MAX_EMAIL_LENGTH = 254;
const GENERIC_MESSAGE =
  "If an account exists for this email, password reset instructions have been sent.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    setMessage("");
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || cleanEmail.length > MAX_EMAIL_LENGTH) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);

      // Backend route: app.use("/api/auth", passwordResetRoutes)
      // Route: router.post("/forgot", ...)
      await api.post("/auth/forgot", {
        email: cleanEmail,
      });

      setMessage(GENERIC_MESSAGE);
      setEmail("");
    } catch {
      // Keep the response generic to prevent account enumeration.
      setMessage(GENERIC_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send password reset instructions if an account exists."
    >
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          inputMode="email"
          maxLength={MAX_EMAIL_LENGTH}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
            setMessage("");
          }}
          disabled={isLoading}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Instructions"}
          {!isLoading && <Mail size={19} />}
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
      >
        <ArrowLeft size={16} />
        Back to Login
      </Link>
    </AuthLayout>
  );
}
