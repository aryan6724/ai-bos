import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
} from "lucide-react";

import NotificationCard from "../components/notifications/NotificationCard";
import socket from "../socket/socket";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notificationService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchNotifications();

  socket.on("new-notification", () => {
    fetchNotifications();
  });

  return () => {
    socket.off("new-notification");
  };
}, []);

  async function fetchNotifications() {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRead(id) {
    await markAsRead(id);
    fetchNotifications();
  }

  async function handleDelete(id) {
    await deleteNotification(id);
    fetchNotifications();
  }

  async function handleReadAll() {
    await markAllAsRead();
    fetchNotifications();
  }

  async function handleDeleteAll() {
    await deleteAllNotifications();
    fetchNotifications();
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Notifications
          </h1>

          <p className="mt-2 text-slate-400">
            Stay updated with all activities inside AI-BOS.
          </p>
        </div>

        <Bell
          size={34}
          className="text-cyan-400"
        />

      </div>

      {/* Buttons */}

      <div className="flex gap-4">

        <button
          onClick={handleReadAll}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 hover:bg-green-700"
        >
          <CheckCheck size={18} />
          Mark All Read
        </button>

        <button
          onClick={handleDeleteAll}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 hover:bg-red-700"
        >
          <Trash2 size={18} />
          Delete All
        </button>

      </div>

      {/* Notifications */}

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900 py-20 text-center text-slate-400">
          No notifications available.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}