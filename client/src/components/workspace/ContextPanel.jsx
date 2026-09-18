export default function ContextPanel() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-semibold text-white">
        Context
      </h3>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl bg-white/5 p-3 text-slate-300">
          Recent Documents
        </div>

        <div className="rounded-xl bg-white/5 p-3 text-slate-300">
          Knowledge Base
        </div>

        <div className="rounded-xl bg-white/5 p-3 text-slate-300">
          Prompt Library
        </div>
      </div>
    </div>
  );
}