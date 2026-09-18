import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../store/AuthContext";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const email = formData.email.trim().toLowerCase();

    if (!email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length > MAX_PASSWORD_LENGTH) {
      setError("Invalid email or password.");
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password: formData.password });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue managing your AI-powered business workspace."
    >
      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
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
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
        />

        {/* Password field is intentionally built here instead of wrapping
            the shared Input component, so the eye is guaranteed to stay
            INSIDE the input's right edge. */}
        <div className="w-full">
          <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-300">
            Password
          </label>

          <div className="relative w-full">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              maxLength={MAX_PASSWORD_LENGTH}
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`${inputClass} pr-14`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-cyan-300 hover:text-cyan-200">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full group" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login to Dashboard"}
          {!isLoading && <ArrowRight className="transition group-hover:translate-x-1" size={19} />}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">OR CONTINUE WITH</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button type="button" className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">G</span>
        Continue with Google
      </button>

      <p className="mt-7 text-center text-sm text-slate-400">
        New to AI-BOS? 
        <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 text-cyan-300" size={18} />
          <div>
            <p className="text-sm font-medium text-cyan-100">Secure Login</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Use your AI-BOS account credentials to continue.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
