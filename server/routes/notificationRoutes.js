import express from "express";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=========================================
All routes require login
=========================================
*/

router.use(protect);

/*
=========================================
GET
=========================================
*/

// Get all notifications
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

/*
=========================================
PATCH
=========================================
*/

// Mark all as read
router.patch("/read-all", markAllAsRead);

// Mark single notification as read
router.patch("/:id/read", markAsRead);

/*
=========================================
DELETE
=========================================
*/

// Delete all notifications
router.delete("/", deleteAllNotifications);

// Delete single notification
router.delete("/:id", deleteNotification);

export default router;