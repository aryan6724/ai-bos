import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const MAX_NOTIFICATIONS_PER_REQUEST = 100;

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

/*
=========================================
Get All Notifications
GET /api/notifications
=========================================
*/

export const getNotifications = async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query?.limit);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), MAX_NOTIFICATIONS_PER_REQUEST)
        : MAX_NOTIFICATIONS_PER_REQUEST;

    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================
Get Unread Count
GET /api/notifications/unread-count
=========================================
*/

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unread: count,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================
Mark One Notification Read
PATCH /api/notifications/:id/read
=========================================
*/

export const markAsRead = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================
Mark All Notifications Read
PATCH /api/notifications/read-all
=========================================
*/

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================
Delete Notification
DELETE /api/notifications/:id
=========================================
*/

export const deleteNotification = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================
Delete All Notifications
DELETE /api/notifications
=========================================
*/

export const deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
