import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Building2, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../store/AuthContext";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_COMPANY_LENGTH = 150;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    companyName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const companyName = formData.companyName.trim();

    if (!fullName || !email || !formData.password) {
      setError("Full name, email, and password are required.");
      return;
    }
    if (fullName.length > MAX_NAME_LENGTH) {
      setError("Full name is too long.");
      return;
    }
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (companyName.length > MAX_COMPANY_LENGTH) {
      setError("Company name is too long.");
      return;
    }
    if (formData.password.length < 8 || formData.password.length > MAX_PASSWORD_LENGTH) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the terms and privacy policy.");
      return;
    }

    try {
      setIsLoading(true);
      await register({ fullName, email, companyName, password: formData.password });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Registration failed. Please check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start building your AI-powered business operating system account."
    >
      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Full name"
          name="fullName"
          type="text"
          placeholder="Your full name"
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          value={formData.fullName}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          label="Work email"
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

        <Input
          label="Company name"
          name="companyName"
          type="text"
          placeholder="Your company"
          autoComplete="organization"
          maxLength={MAX_COMPANY_LENGTH}
          value={formData.companyName}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="w-full">
          <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-slate-300">
            Password
          </label>

          <div className="relative w-full">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
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

        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked);
              setError("");
            }}
            disabled={isLoading}
            className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.04] accent-cyan-400"
          />
          <span>
            I agree to the 
            <a href="/terms" className="font-medium text-cyan-300 hover:text-cyan-200">Terms</a> 
            and 
            <a href="/privacy" className="font-medium text-cyan-300 hover:text-cyan-200">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full group" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
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
        Sign up with Google
      </button>

      <p className="mt-7 text-center text-sm text-slate-400">
        Already have an account? 
        <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">Login</Link>
      </p>

      <div className="mt-8 rounded-2xl border border-violet-400/10 bg-violet-400/5 p-4">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 text-violet-300" size={18} />
          <div>
            <p className="text-sm font-medium text-violet-100">Workspace Setup</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your account creates a workspace with role-based access support.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
