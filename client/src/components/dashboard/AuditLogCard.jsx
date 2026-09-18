import {
  User,
  Clock3,
  Activity,
  FileText,
} from "lucide-react";

export default function AuditLogCard({ log }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-cyan-400/30 hover:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-white font-semibold">
            <Activity size={18} />
            {log.action}
          </h3>

          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <User size={16} />
            {log.user?.fullName || "Unknown User"}
          </p>

          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <FileText size={16} />
            {log.details || "No details"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 size={15} />
          {new Date(log.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}