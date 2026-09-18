import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-10">

        {/* Background Glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
            <ShieldAlert size={30} />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Access Restricted
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Unauthorized Access
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400">
            You do not have permission to access
            this workspace area. Please contact
            your administrator if you believe this
            is an error.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <LayoutDashboard size={17} />
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft size={17} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}