import Card from "../ui/Card";
import Badge from "../ui/Badge";

const defaultBars = [
  { label: "Mon", value: 8, count: 0 },
  { label: "Tue", value: 8, count: 0 },
  { label: "Wed", value: 8, count: 0 },
  { label: "Thu", value: 8, count: 0 },
  { label: "Fri", value: 8, count: 0 },
  { label: "Sat", value: 8, count: 0 },
  { label: "Sun", value: 8, count: 0 },
];

export default function AnalyticsPreview({
  usageBars = defaultBars,
  totalRequests = "0",
  successRate = "98.4%",
  avgResponseTime = "1.2s",
}) {
  const bars = usageBars.length > 0 ? usageBars : defaultBars;

  return (
    <Card className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Weekly AI Usage</p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            Analytics Overview
          </h3>
        </div>

        <Badge variant="cyan" className="px-3 py-1 text-xs">
          Live Data
        </Badge>
      </div>

      <div className="flex h-64 items-end gap-4 border-b border-white/10 pb-4">
        {bars.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-52 w-full items-end rounded-full bg-white/[0.03] p-1">
              <div
                className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-cyan-200 shadow-lg shadow-cyan-500/20"
                style={{ height: `${item.value}%` }}
                title={`${item.count || 0} requests`}
              />
            </div>

            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-slate-400">Total Requests</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {totalRequests}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Success Rate</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {successRate}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Avg. Response</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {avgResponseTime}
          </p>
        </div>
      </div>
    </Card>
  );
}