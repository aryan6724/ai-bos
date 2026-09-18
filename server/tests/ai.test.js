import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";

import request from "supertest";

import app from "../app.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

import User from "../models/User.js";
import Generation from "../models/Generation.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import { generateToken } from "../utils/generateToken.js";

import * as aiClient from "../utils/aiClient.js";

describe("AI API", () => {
  let user;
  let otherUser;

  let userToken;
  let otherToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    user = await User.create({
      fullName: "AI Test User",
      email: "ai-test@example.com",
      companyName: "AI Test Company",
      password: "password123",
      role: "admin",
      isActive: true,
      avatarInitial: "A",
    });

    otherUser = await User.create({
      fullName: "Other AI User",
      email: "other-ai@example.com",
      companyName: "Other AI Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "O",
    });

    userToken = generateToken(user._id);
    otherToken = generateToken(otherUser._id);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // ======================================================
  // Authentication
  // ======================================================

  it("should reject AI generation without authentication", async () => {
    const response = await request(app)
      .post("/api/ai/generate")
      .send({
        type: "email",
        input: {
          purpose: "Business follow-up",
        },
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject AI chat without authentication", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .send({
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject streaming AI chat without authentication", async () => {
    const response = await request(app)
      .post("/api/ai/chat/stream")
      .send({
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject AI history without authentication", async () => {
    const response = await request(app)
      .get("/api/ai/history");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // Generation Validation
  // ======================================================

  it("should reject AI generation when type and input are missing", async () => {
    const response = await request(app)
      .post("/api/ai/generate")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Generation type and input are required"
    );
  });

  it("should reject an invalid AI generation type", async () => {
    const response = await request(app)
      .post("/api/ai/generate")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        type: "invalid-type",
        input: {
          title: "Test",
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid generation type"
    );
  });

  // ======================================================
  // Successful AI Generation
  // ======================================================

  it("should generate an AI document successfully", async () => {
    const aiSpy = vi
      .spyOn(aiClient, "generateAIContent")
      .mockResolvedValue({
        output: "This is a generated business email.",
        provider: "gemini",
        model: "test-model",
      });

    const response = await request(app)
      .post("/api/ai/generate")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        type: "email",
        input: {
          purpose: "Business follow-up",
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Document generated successfully"
    );

    expect(response.body.generation).toBeDefined();

    expect(response.body.generation.type).toBe(
      "email"
    );

    expect(response.body.generation.output).toBe(
      "This is a generated business email."
    );

    expect(response.body.generation.provider).toBe(
      "gemini"
    );

    expect(response.body.generation.model).toBe(
      "test-model"
    );

    expect(aiSpy).toHaveBeenCalledTimes(1);

    const savedGeneration =
      await Generation.findOne({
        user: user._id,
      });

    expect(savedGeneration).not.toBeNull();

    expect(savedGeneration.type).toBe("email");

    aiSpy.mockRestore();
  });

  // ======================================================
  // AI Provider Error
  // ======================================================

  it("should handle an AI provider error", async () => {
    const aiSpy = vi
      .spyOn(aiClient, "generateAIContent")
      .mockRejectedValue(
        new Error("AI provider failed")
      );

    const response = await request(app)
      .post("/api/ai/generate")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        type: "email",
        input: {
          purpose: "Business follow-up",
        },
      });

    expect(response.status).toBeGreaterThanOrEqual(
      500
    );

    expect(response.body.success).toBe(false);

    aiSpy.mockRestore();
  });

  // ======================================================
  // Chat Validation
  // ======================================================

  it("should reject AI chat when messages are missing", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Messages are required"
    );
  });

  it("should reject AI streaming chat when messages are missing", async () => {
    const response = await request(app)
      .post("/api/ai/chat/stream")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Messages are required"
    );
  });

  it("should reject an unknown conversation", async () => {
    const fakeConversationId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .post("/api/ai/chat")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        conversationId: fakeConversationId,
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Conversation not found"
    );
  });

  // ======================================================
  // Successful AI Chat
  // ======================================================

  it("should successfully chat with AI", async () => {
    const aiSpy = vi
      .spyOn(aiClient, "generateAIContent")
      .mockResolvedValue({
        output: "Hello! How can I help you?",
        provider: "gemini",
        model: "test-model",
      });

    const response = await request(app)
      .post("/api/ai/chat")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.conversationId).toBeDefined();

    expect(response.body.response).toBe(
      "Hello! How can I help you?"
    );

    expect(response.body.provider).toBe(
      "gemini"
    );

    expect(response.body.model).toBe(
      "test-model"
    );

    expect(aiSpy).toHaveBeenCalledTimes(1);

    const conversation =
      await Conversation.findOne({
        user: user._id,
      });

    expect(conversation).not.toBeNull();

    const messages = await Message.find({
      conversation: conversation._id,
    }).sort({
      createdAt: 1,
    });

    expect(messages.length).toBe(2);

    expect(messages[0].role).toBe("user");

    expect(messages[0].content).toBe("Hello");

    expect(messages[1].role).toBe(
      "assistant"
    );

    expect(messages[1].content).toBe(
      "Hello! How can I help you?"
    );

    aiSpy.mockRestore();
  });

  // ======================================================
  // Chat With Existing Conversation
  // ======================================================

  it("should chat inside the authenticated user's existing conversation", async () => {
    const conversation =
      await Conversation.create({
        user: user._id,
        title: "Existing Chat",
      });

    const aiSpy = vi
      .spyOn(aiClient, "generateAIContent")
      .mockResolvedValue({
        output: "This is the second response.",
        provider: "gemini",
        model: "test-model",
      });

    const response = await request(app)
      .post("/api/ai/chat")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        conversationId: String(
          conversation._id
        ),
        messages: [
          {
            role: "user",
            content: "Continue this conversation",
          },
        ],
      });

    expect(response.status).toBe(200);

    expect(
      String(response.body.conversationId)
    ).toBe(String(conversation._id));

    expect(response.body.response).toBe(
      "This is the second response."
    );

    aiSpy.mockRestore();
  });

  // ======================================================
  // Conversation User Isolation
  // ======================================================

  it("should not allow another user to access a conversation", async () => {
    const conversation =
      await Conversation.create({
        user: user._id,
        title: "Private Conversation",
      });

    const aiSpy = vi
      .spyOn(aiClient, "generateAIContent")
      .mockResolvedValue({
        output: "Should not be returned.",
        provider: "gemini",
        model: "test-model",
      });

    const response = await request(app)
      .post("/api/ai/chat")
      .set(
        "Authorization",
        `Bearer ${otherToken}`
      )
      .send({
        conversationId: String(
          conversation._id
        ),
        messages: [
          {
            role: "user",
            content: "Try to access this",
          },
        ],
      });

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Conversation not found"
    );

    expect(aiSpy).not.toHaveBeenCalled();

    aiSpy.mockRestore();
  });

  // ======================================================
  // AI Chat Provider Error
  // ======================================================

  it("should handle an AI chat provider error", async () => {
    const aiSpy = vi
      .spyOn(aiClient, "generateAIContent")
      .mockRejectedValue(
        new Error("AI chat provider failed")
      );

    const response = await request(app)
      .post("/api/ai/chat")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        messages: [
          {
            role: "user",
            content: "Hello AI",
          },
        ],
      });

    expect(response.status).toBeGreaterThanOrEqual(
      500
    );

    expect(response.body.success).toBe(false);

    aiSpy.mockRestore();
  });

  // ======================================================
  // AI History
  // ======================================================

  it("should allow an authenticated user to access AI history", async () => {
    const response = await request(app)
      .get("/api/ai/history")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(0);

    expect(
      Array.isArray(response.body.generations)
    ).toBe(true);
  });

  // ======================================================
  // AI History User Isolation
  // ======================================================

  it("should only return generations belonging to the logged-in user", async () => {
    await Generation.create({
      user: user._id,
      type: "email",
      title: "My Generation",
      input: {
        purpose: "My email",
      },
      output: "My generated content",
      provider: "gemini",
      model: "test-model",
    });

    await Generation.create({
      user: otherUser._id,
      type: "email",
      title: "Other Generation",
      input: {
        purpose: "Other email",
      },
      output: "Other generated content",
      provider: "gemini",
      model: "test-model",
    });

    const response = await request(app)
      .get("/api/ai/history")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(1);

    expect(
      response.body.generations.length
    ).toBe(1);

    expect(
      response.body.generations[0].title
    ).toBe("My Generation");

    expect(
      String(response.body.generations[0].user)
    ).toBe(String(user._id));
  });
});