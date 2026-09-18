import {
  FileText,
  MessageSquareText,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Card from "../ui/Card";

const iconMap = {
  generation: Sparkles,
  document: UploadCloud,
  chat: MessageSquareText,
  default: FileText,
};

const formatActivityTime = (dateValue) => {
  if (!dateValue) return "Recently";

  const diff = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);

  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export default function RecentActivity({ activities = [] }) {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Workspace Events</p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            Recent Activity
          </h3>
        </div>

        <button className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
          Live
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm leading-6 text-slate-400">
            No recent activity yet. Generate documents, upload files, or ask
            document questions to see activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.type] || iconMap.default;

            return (
              <div key={`${activity.title}-${index}`} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-cyan-300">
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-white">{activity.title}</p>

                    <span className="shrink-0 text-xs text-slate-500">
                      {formatActivityTime(activity.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {activity.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}