import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Home } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-6 py-10 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-violet-500/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      <Card className="w-full max-w-2xl p-2 text-center shadow-2xl shadow-black/40">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 px-6 py-12 sm:px-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/30">
            <Brain size={30} />
          </div>

          <p className="mt-8 text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">
            404 Error
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Page not found
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
            The page you are trying to open does not exist or may have been
            moved. Return to the AI-BOS dashboard or go back to the landing page.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button as={Link} to="/dashboard" size="lg">
              <Home size={19} />
              Go to Dashboard
            </Button>

            <Button as={Link} to="/" variant="secondary" size="lg">
              <ArrowLeft size={19} />
              Back to Home
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}