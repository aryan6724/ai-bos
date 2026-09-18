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

import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Conversation API", () => {
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
        fullName: "Conversation User",
        email: "conversation@example.com",
        companyName: "Conversation Company",
        password: "password123",
      });

    expect(userResponse.status).toBe(201);

    token = userResponse.body.token;

    user = await User.findOne({
      email: "conversation@example.com",
    });

    // ==========================================
    // Create second user
    // ==========================================
    const otherUserResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Other Conversation User",
        email: "other-conversation@example.com",
        companyName: "Other Company",
        password: "password123",
      });

    expect(otherUserResponse.status).toBe(201);

    otherToken = otherUserResponse.body.token;

    otherUser = await User.findOne({
      email: "other-conversation@example.com",
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // ==========================================
  // Authentication
  // ==========================================

  it("should reject conversation access without authentication", async () => {
    const response = await request(app)
      .get("/api/conversations");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // Create Conversation
  // ==========================================

  it("should create a new conversation successfully", async () => {
    const response = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.conversation).toBeDefined();

    expect(
      response.body.conversation.title
    ).toBe("New Chat");

    expect(
      String(response.body.conversation.user)
    ).toBe(String(user._id));
  });

  // ==========================================
  // Get Conversations
  // ==========================================

  it("should return the authenticated user's conversations", async () => {
    await Conversation.create([
      {
        user: user._id,
        title: "My First Chat",
      },
      {
        user: user._id,
        title: "My Second Chat",
      },
    ]);

    const response = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.conversations).toHaveLength(2);
  });

  // ==========================================
  // User Isolation
  // ==========================================

  it("should not return another user's conversations", async () => {
    await Conversation.create([
      {
        user: user._id,
        title: "My Private Chat",
      },
      {
        user: otherUser._id,
        title: "Other Private Chat",
      },
    ]);

    const response = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.conversations).toHaveLength(1);

    expect(
      response.body.conversations[0].title
    ).toBe("My Private Chat");
  });

  // ==========================================
  // Get Conversation Messages
  // ==========================================

  it("should return a conversation and its messages", async () => {
    const conversation = await Conversation.create({
      user: user._id,
      title: "Message Test Chat",
    });

    await Message.create([
      {
        conversation: conversation._id,
        role: "user",
        content: "Hello AI",
      },
      {
        conversation: conversation._id,
        role: "assistant",
        content: "Hello! How can I help?",
      },
    ]);

    const response = await request(app)
      .get(
        `/api/conversations/${conversation._id}`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.conversation).toBeDefined();

    expect(response.body.messages).toHaveLength(2);

    expect(
      response.body.messages[0].content
    ).toBe("Hello AI");

    expect(
      response.body.messages[1].content
    ).toBe("Hello! How can I help?");
  });

  // ==========================================
  // Reject Other User Conversation
  // ==========================================

  it("should reject access to another user's conversation", async () => {
    const conversation = await Conversation.create({
      user: otherUser._id,
      title: "Private Other Chat",
    });

    await Message.create({
      conversation: conversation._id,
      role: "user",
      content: "Private message",
    });

    const response = await request(app)
      .get(
        `/api/conversations/${conversation._id}`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // Rename Conversation
  // ==========================================

  it("should rename the authenticated user's conversation", async () => {
    const conversation = await Conversation.create({
      user: user._id,
      title: "Old Title",
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}`
      )
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "New Title",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.conversation.title
    ).toBe("New Title");

    const updated =
      await Conversation.findById(conversation._id);

    expect(updated.title).toBe("New Title");
  });

  // ==========================================
  // Reject Rename Other User
  // ==========================================

  it("should reject renaming another user's conversation", async () => {
    const conversation = await Conversation.create({
      user: otherUser._id,
      title: "Other User Chat",
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}`
      )
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Hacked Title",
      });

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    const unchanged =
      await Conversation.findById(conversation._id);

    expect(unchanged.title).toBe("Other User Chat");
  });

  // ==========================================
  // Pin Conversation
  // ==========================================

  it("should pin the authenticated user's conversation", async () => {
    const conversation = await Conversation.create({
      user: user._id,
      title: "Pin Test",
      pinned: false,
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}/pin`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.conversation.pinned).toBe(true);

    const updated =
      await Conversation.findById(conversation._id);

    expect(updated.pinned).toBe(true);
  });

  // ==========================================
  // Unpin Conversation
  // ==========================================

  it("should unpin an already pinned conversation", async () => {
    const conversation = await Conversation.create({
      user: user._id,
      title: "Unpin Test",
      pinned: true,
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}/pin`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.conversation.pinned).toBe(false);

    const updated =
      await Conversation.findById(conversation._id);

    expect(updated.pinned).toBe(false);
  });

  // ==========================================
  // Reject Pin Other User
  // ==========================================

  it("should reject pinning another user's conversation", async () => {
    const conversation = await Conversation.create({
      user: otherUser._id,
      title: "Other Pin Test",
      pinned: false,
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}/pin`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // Archive Conversation
  // ==========================================

  it("should archive the authenticated user's conversation", async () => {
    const conversation = await Conversation.create({
      user: user._id,
      title: "Archive Test",
      archived: false,
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}/archive`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.conversation.archived
    ).toBe(true);

    const updated =
      await Conversation.findById(conversation._id);

    expect(updated.archived).toBe(true);
  });

  // ==========================================
  // Archived Conversations Hidden
  // ==========================================

  it("should not return archived conversations in the conversation list", async () => {
    await Conversation.create([
      {
        user: user._id,
        title: "Active Chat",
        archived: false,
      },
      {
        user: user._id,
        title: "Archived Chat",
        archived: true,
      },
    ]);

    const response = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.conversations).toHaveLength(1);

    expect(
      response.body.conversations[0].title
    ).toBe("Active Chat");
  });

  // ==========================================
  // Reject Archive Other User
  // ==========================================

  it("should reject archiving another user's conversation", async () => {
    const conversation = await Conversation.create({
      user: otherUser._id,
      title: "Other Archive Test",
      archived: false,
    });

    const response = await request(app)
      .patch(
        `/api/conversations/${conversation._id}/archive`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // Delete Conversation
  // ==========================================

  it("should delete the authenticated user's conversation", async () => {
    const conversation = await Conversation.create({
      user: user._id,
      title: "Delete Test",
    });

    await Message.create([
      {
        conversation: conversation._id,
        role: "user",
        content: "Delete this message",
      },
      {
        conversation: conversation._id,
        role: "assistant",
        content: "Delete this answer",
      },
    ]);

    const response = await request(app)
      .delete(
        `/api/conversations/${conversation._id}`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const deletedConversation =
      await Conversation.findById(conversation._id);

    expect(deletedConversation).toBeNull();

    const remainingMessages =
      await Message.countDocuments({
        conversation: conversation._id,
      });

    expect(remainingMessages).toBe(0);
  });

  // ==========================================
  // Reject Delete Other User
  // ==========================================

  it("should reject deleting another user's conversation", async () => {
    const conversation = await Conversation.create({
      user: otherUser._id,
      title: "Other Delete Test",
    });

    await Message.create({
      conversation: conversation._id,
      role: "user",
      content: "Private message",
    });

    const response = await request(app)
      .delete(
        `/api/conversations/${conversation._id}`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    const stillExists =
      await Conversation.findById(conversation._id);

    expect(stillExists).not.toBeNull();

    const messageStillExists =
      await Message.countDocuments({
        conversation: conversation._id,
      });

    expect(messageStillExists).toBe(1);
  });

  // ==========================================
  // Invalid Conversation ID
  // ==========================================

  it("should reject an invalid conversation id", async () => {
    const response = await request(app)
      .get("/api/conversations/invalid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBeGreaterThanOrEqual(400);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // Other User Token Isolation
  // ==========================================

  it("should only return conversations belonging to the logged-in user", async () => {
    await Conversation.create({
      user: user._id,
      title: "Primary User Chat",
    });

    await Conversation.create({
      user: otherUser._id,
      title: "Secondary User Chat",
    });

    const response = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(response.status).toBe(200);

    expect(response.body.conversations).toHaveLength(1);

    expect(
      response.body.conversations[0].title
    ).toBe("Secondary User Chat");
  });
});