import {
  Activity,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";

export default function AuditStats({ logs = [] }) {
  const total = logs.length;

  const success = logs.filter(
    (log) => log.outcome === "success"
  ).length;

  const failed = logs.filter(
    (log) => log.outcome === "failure"
  ).length;

  const today = logs.filter((log) => {
    if (!log.createdAt) return false;

    const logDate = new Date(log.createdAt).toDateString();
    const currentDate = new Date().toDateString();

    return logDate === currentDate;
  }).length;

  const cards = [
    {
      title: "Total Logs",
      value: total,
      icon: Activity,
      color: "text-cyan-400",
    },
    {
      title: "Success",
      value: success,
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      title: "Failed",
      value: failed,
      icon: XCircle,
      color: "text-red-400",
    },
    {
      title: "Today",
      value: today,
      icon: CalendarDays,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-3xl border border-white/10 bg-slate-900 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                  {card.value}
                </h2>
              </div>

              <Icon
                size={34}
                className={card.color}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}