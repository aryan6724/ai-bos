import Notification from "../models/Notification.js";
import { io } from "../server.js";
const createNotification = async ({
  user,
  companyName,
  title,
  message,
  type = "info",
  category = "system",
  actionUrl = "",
  icon = "Bell",
  metadata = {},
}) => {
  try {
    if (!user) {
      throw new Error("User is required to create notification.");
    }

    const notification = await Notification.create({
      user: user._id || user,
      companyName:
        companyName ||
        user.companyName ||
        "AI-BOS Workspace",

      title,
      message,
      type,
      category,
      actionUrl,
      icon,
      metadata,
    });

    io.to(notification.user.toString()).emit(
  "new-notification",
  notification
);

    return notification;
  } catch (error) {
    console.error("Create Notification Error:", error.message);
    return null;
  }
};

export default createNotification;