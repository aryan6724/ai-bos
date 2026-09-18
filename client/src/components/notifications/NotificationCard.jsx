import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function NotificationCard({
  notification,
  onRead,
  onDelete,
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return (
          <CheckCircle2
            className="text-green-400"
            size={22}
          />
        );

      case "warning":
        return (
          <AlertTriangle
            className="text-yellow-400"
            size={22}
          />
        );

      case "error":
        return (
          <XCircle
            className="text-red-400"
            size={22}
          />
        );

      case "info":
        return (
          <Info
            className="text-cyan-400"
            size={22}
          />
        );

      default:
        return (
          <Bell
            className="text-cyan-400"
            size={22}
          />
        );
    }
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 ${
        notification.isRead
          ? "border-slate-800 bg-slate-900/80"
          : "border-cyan-500/30 bg-cyan-500/5 shadow-lg shadow-cyan-950/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Notification Content */}

        <div className="flex min-w-0 gap-4">
          <div className="mt-1 shrink-0">
            {getIcon()}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">
                {notification.title}
              </h3>

              {!notification.isRead && (
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300">
                  New
                </span>
              )}
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              {notification.message}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                {new Date(
                  notification.createdAt
                ).toLocaleString()}
              </span>

              {notification.category && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 capitalize text-slate-400">
                  {notification.category}
                </span>
              )}
            </div>

            {/* Action */}

            {notification.actionUrl && (
              <button
                onClick={handleAction}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Open
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}

        <div className="flex shrink-0 items-center gap-2">
          {!notification.isRead && (
            <button
              onClick={() => onRead(notification._id)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
            >
              Mark Read
            </button>
          )}

          <button
            onClick={() => onDelete(notification._id)}
            aria-label="Delete notification"
            className="rounded-lg bg-red-600/90 p-2 text-white transition hover:bg-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}