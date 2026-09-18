import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import Button from "../ui/Button";

export default function MarketingNavbar() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-2xl">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30">
          <Brain size={24} />
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">AI-BOS</h1>
          <p className="text-xs text-slate-400">Business Operating System</p>
        </div>
      </Link>

      <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
        <a href="/#features" className="transition hover:text-white">
          Features
        </a>
        <a href="/#platform" className="transition hover:text-white">
          Platform
        </a>
        <a href="/#security" className="transition hover:text-white">
          Security
        </a>
      </div>

      <Button
        as={Link}
        to="/login"
        variant="secondary"
        size="md"
        className="bg-white text-slate-950 hover:bg-cyan-200"
      >
        Login
      </Button>
    </nav>
  );
}