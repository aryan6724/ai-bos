import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";

import request from "supertest";

import app from "../app.js";

import Notification from "../models/Notification.js";
import User from "../models/User.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Notification API", () => {
  let user;
  let otherUser;
  let token;
  let otherToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // ==========================================
    // Create primary user
    // ==========================================
    const userResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Notification User",
        email: "notification@example.com",
        companyName: "Notification Company",
        password: "password123",
      });

    token = userResponse.body.token;

    user = await User.findOne({
      email: "notification@example.com",
    });

    // ==========================================
    // Create second user
    // ==========================================
    const otherUserResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Other Notification User",
        email: "other-notification@example.com",
        companyName: "Other Company",
        password: "password123",
      });

    otherToken = otherUserResponse.body.token;

    otherUser = await User.findOne({
      email: "other-notification@example.com",
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // ==========================================
  // Authentication
  // ==========================================

  it("should reject notification access without authentication", async () => {
    const response = await request(app)
      .get("/api/notifications");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // Get Notifications
  // ==========================================

  it("should return notifications for the authenticated user", async () => {
    await Notification.create([
      {
        user: user._id,
        companyName: "Notification Company",
        title: "Welcome",
        message: "Welcome to AI-BOS.",
        type: "success",
        category: "system",
        isRead: false,
      },
      {
        user: user._id,
        companyName: "Notification Company",
        title: "Profile Updated",
        message: "Your profile was updated.",
        type: "info",
        category: "profile",
        isRead: true,
      },
    ]);

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(2);

    expect(response.body.notifications).toHaveLength(2);
  });

  // ==========================================
  // User Isolation
  // ==========================================

  it("should not return another user's notifications", async () => {
    await Notification.create([
      {
        user: user._id,
        companyName: "Notification Company",
        title: "My Notification",
        message: "This belongs to the authenticated user.",
        type: "info",
        category: "system",
      },
      {
        user: otherUser._id,
        companyName: "Other Company",
        title: "Private Notification",
        message: "This belongs to another user.",
        type: "warning",
        category: "system",
      },
    ]);

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.count).toBe(1);

    expect(
      response.body.notifications[0].title
    ).toBe("My Notification");
  });

  // ==========================================
  // Unread Count
  // ==========================================

  it("should return the correct unread notification count", async () => {
    await Notification.create([
      {
        user: user._id,
        title: "Unread One",
        message: "First unread notification.",
        type: "info",
        category: "system",
        isRead: false,
      },
      {
        user: user._id,
        title: "Unread Two",
        message: "Second unread notification.",
        type: "warning",
        category: "system",
        isRead: false,
      },
      {
        user: user._id,
        title: "Already Read",
        message: "This notification is already read.",
        type: "success",
        category: "system",
        isRead: true,
      },
    ]);

    const response = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.unread).toBe(2);
  });

  // ==========================================
  // Mark Single Notification As Read
  // ==========================================

  it("should mark the authenticated user's notification as read", async () => {
    const notification = await Notification.create({
      user: user._id,
      title: "Unread Notification",
      message: "Please mark this as read.",
      type: "info",
      category: "system",
      isRead: false,
    });

    const response = await request(app)
      .patch(
        `/api/notifications/${notification._id}/read`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.notification.isRead).toBe(true);

    const updatedNotification =
      await Notification.findById(notification._id);

    expect(updatedNotification.isRead).toBe(true);
  });

  // ==========================================
  // Prevent Reading Another User's Notification
  // ==========================================

  it("should reject marking another user's notification as read", async () => {
    const notification = await Notification.create({
      user: otherUser._id,
      companyName: "Other Company",
      title: "Private Notification",
      message: "Private notification.",
      type: "warning",
      category: "system",
      isRead: false,
    });

    const response = await request(app)
      .patch(
        `/api/notifications/${notification._id}/read`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    const unchanged =
      await Notification.findById(notification._id);

    expect(unchanged.isRead).toBe(false);
  });

  // ==========================================
  // Mark All As Read
  // ==========================================

  it("should mark all authenticated user's notifications as read", async () => {
    await Notification.create([
      {
        user: user._id,
        title: "Notification One",
        message: "Unread one.",
        type: "info",
        category: "system",
        isRead: false,
      },
      {
        user: user._id,
        title: "Notification Two",
        message: "Unread two.",
        type: "warning",
        category: "system",
        isRead: false,
      },
      {
        user: otherUser._id,
        companyName: "Other Company",
        title: "Other Notification",
        message: "Should remain unread.",
        type: "info",
        category: "system",
        isRead: false,
      },
    ]);

    const response = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const ownUnreadCount =
      await Notification.countDocuments({
        user: user._id,
        isRead: false,
      });

    expect(ownUnreadCount).toBe(0);

    const otherUnreadCount =
      await Notification.countDocuments({
        user: otherUser._id,
        isRead: false,
      });

    expect(otherUnreadCount).toBe(1);
  });

  // ==========================================
  // Delete Single Notification
  // ==========================================

  it("should delete the authenticated user's notification", async () => {
    const notification = await Notification.create({
      user: user._id,
      title: "Delete Me",
      message: "This notification should be deleted.",
      type: "info",
      category: "system",
    });

    const response = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const deleted =
      await Notification.findById(notification._id);

    expect(deleted).toBeNull();
  });

  // ==========================================
  // Prevent Deleting Another User's Notification
  // ==========================================

  it("should reject deleting another user's notification", async () => {
    const notification = await Notification.create({
      user: otherUser._id,
      companyName: "Other Company",
      title: "Private Notification",
      message: "This belongs to another user.",
      type: "warning",
      category: "system",
    });

    const response = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    const stillExists =
      await Notification.findById(notification._id);

    expect(stillExists).not.toBeNull();
  });

  // ==========================================
  // Delete All Notifications
  // ==========================================

  it("should delete all notifications belonging to the authenticated user", async () => {
    await Notification.create([
      {
        user: user._id,
        title: "Notification One",
        message: "First notification.",
        type: "info",
        category: "system",
      },
      {
        user: user._id,
        title: "Notification Two",
        message: "Second notification.",
        type: "success",
        category: "document",
      },
      {
        user: otherUser._id,
        companyName: "Other Company",
        title: "Other Notification",
        message: "Should not be deleted.",
        type: "warning",
        category: "system",
      },
    ]);

    const response = await request(app)
      .delete("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const ownCount =
      await Notification.countDocuments({
        user: user._id,
      });

    expect(ownCount).toBe(0);

    const otherCount =
      await Notification.countDocuments({
        user: otherUser._id,
      });

    expect(otherCount).toBe(1);
  });

  // ==========================================
  // Invalid Notification ID
  // ==========================================

  it("should reject an invalid notification id", async () => {
    const response = await request(app)
      .delete("/api/notifications/invalid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBeGreaterThanOrEqual(400);

    expect(response.body.success).toBe(false);
  });
});