import { Link } from "react-router-dom";
import {
  Bell,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function NotificationDropdown({
  notifications = [],
  onRead,
  onDelete,
}) {
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const visibleNotifications = notifications.slice(0, 5);

  const handleAction = (actionUrl) => {
    if (!actionUrl) return;

    window.location.href = actionUrl;
  };

  return (
    <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-96 rounded-3xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
      {/* Header */}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Bell size={20} className="text-cyan-400" />
          Notifications
        </h3>

        <span className="rounded-full bg-cyan-500 px-2.5 py-1 text-xs font-semibold text-white">
          {unreadCount}
        </span>
      </div>

      {/* Notifications */}

      {visibleNotifications.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <Bell
            size={28}
            className="mx-auto mb-3 text-slate-600"
          />

          <p>No notifications</p>
        </div>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {visibleNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`rounded-xl border p-3 transition ${
                notification.isRead
                  ? "border-slate-800 bg-slate-900"
                  : "border-cyan-500/30 bg-cyan-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Content */}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium text-white">
                      {notification.title}
                    </h4>

                    {!notification.isRead && (
                      <span className="shrink-0 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-cyan-300">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </p>

                  {/* Action */}

                  {notification.actionUrl && (
                    <button
                      onClick={() =>
                        handleAction(notification.actionUrl)
                      }
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                    >
                      Open
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>

                {/* Actions */}

                <div className="flex shrink-0 flex-col gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() =>
                        onRead(notification._id)
                      }
                      aria-label="Mark notification as read"
                      className="rounded-lg p-1.5 transition hover:bg-green-500/10"
                    >
                      <CheckCircle2
                        size={18}
                        className="text-green-400"
                      />
                    </button>
                  )}

                  <button
                    onClick={() =>
                      onDelete(notification._id)
                    }
                    aria-label="Delete notification"
                    className="rounded-lg p-1.5 transition hover:bg-red-500/10"
                  >
                    <Trash2
                      size={18}
                      className="text-red-400"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All */}

      <Link
        to="/dashboard/notifications"
        className="mt-5 block rounded-xl bg-cyan-600 py-3 text-center font-medium text-white transition hover:bg-cyan-700"
      >
        View All Notifications
      </Link>
    </div>
  );
}