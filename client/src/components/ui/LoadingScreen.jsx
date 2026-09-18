import { Brain } from "lucide-react";

export default function LoadingScreen({ text = "Loading AI-BOS..." }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/30">
          <Brain size={30} />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">AI-BOS</h1>

        <p className="mt-2 text-sm text-slate-400">{text}</p>

        <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[loading_1.4s_ease-in-out_infinite] rounded-full bg-cyan-300" />
        </div>
      </div>
    </main>
  );
}