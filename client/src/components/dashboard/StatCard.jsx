import Card from "../ui/Card";

export default function StatCard({ title, value, change, icon: Icon }) {
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Icon size={22} />
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          {change}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-sm text-slate-400">{title}</p>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {value}
        </h3>
      </div>
    </Card>
  );
}