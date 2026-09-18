import { Cpu, Wifi } from "lucide-react";

export default function WorkspaceHeader() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4">
      <div>
        <p className="text-sm text-slate-400">
          Enterprise AI Workspace
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          AI Workspace
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          <Wifi size={15} />
          Connected
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
          <Cpu size={15} />
          GPT-4.1
        </div>
      </div>
    </div>
  );
}