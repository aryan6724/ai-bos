import { Link } from "react-router-dom";
import { Brain, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";

const benefits = [
  "AI-powered business document generation",
  "Secure JWT authentication workflow",
  "Role-based dashboard for teams",
  "Document intelligence and analytics ready",
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] px-6 py-8 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30">
            <Brain size={24} />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">AI-BOS</h1>
            <p className="text-xs text-slate-400">Business Operating System</p>
          </div>
        </Link>

        <Link
          to="/"
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          Back to Home
        </Link>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block">
          <Badge variant="cyan">Secure AI SaaS Workspace</Badge>

          <h2 className="mt-8 max-w-2xl text-5xl font-semibold leading-[1.04] tracking-tight xl:text-6xl">
            Access your intelligent business command center.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Sign in to manage AI tools, documents, team roles, analytics, and
            business automation workflows from one premium dashboard.
          </p>

          <div className="mt-10 space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="text-cyan-300" size={20} />
                <p className="text-slate-300">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid max-w-xl grid-cols-2 gap-5">
            <Card className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <ShieldCheck size={22} />
              </div>
              <p className="text-2xl font-semibold">Enterprise</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Designed with protected routes, roles, and secure API workflows.
              </p>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                <Sparkles size={22} />
              </div>
              <p className="text-2xl font-semibold">AI Ready</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Built to connect with document generation, RAG, and analytics.
              </p>
            </Card>
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <Card className="p-2 shadow-2xl shadow-black/40">
            <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/80 p-6 sm:p-8">
              <div className="mb-8">
                <Badge variant="violet" className="px-3 py-1 text-xs">
                  AI-BOS Access
                </Badge>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight">
                  {title}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {subtitle}
                </p>
              </div>

              {children}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}