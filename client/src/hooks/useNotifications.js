import { useEffect, useState } from "react";
import socket from "../socket/socket";
import { getUnreadCount } from "../services/notificationService";

export default function useNotifications() {
  const [unread, setUnread] = useState(0);

  const loadUnread = async () => {
    try {
      const data = await getUnreadCount();
      setUnread(data.unread || 0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadUnread();

    socket.on("new-notification", loadUnread);

    return () => {
      socket.off("new-notification", loadUnread);
    };
  }, []);

  return {
    unread,
    refreshUnread: loadUnread,
  };
}