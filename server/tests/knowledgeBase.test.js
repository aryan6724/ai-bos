import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
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
import { generateToken } from "../utils/generateToken.js";

import * as ragService from "../services/ragService.js";

describe("Knowledge Base API", () => {
  let adminUser;
  let otherUser;
  let adminToken;
  let otherToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    adminUser = await User.create({
      fullName: "Knowledge Admin",
      email: "knowledge-admin@example.com",
      companyName: "Knowledge Company",
      password: "password123",
      role: "admin",
      isActive: true,
      avatarInitial: "K",
    });

    otherUser = await User.create({
      fullName: "Other Knowledge User",
      email: "knowledge-other@example.com",
      companyName: "Other Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "O",
    });

    adminToken = generateToken(adminUser._id);
    otherToken = generateToken(otherUser._id);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // =====================================================
  // Authentication
  // =====================================================

  it(
    "should reject knowledge base access without authentication",
    async () => {
      const response = await request(app)
        .post("/api/knowledge-base/ask")
        .send({
          question: "What is AI-BOS?",
        });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    }
  );

  // =====================================================
  // Valid Question
  // =====================================================

  it(
    "should answer a valid knowledge base question",
    async () => {
      const ragSpy = vi
        .spyOn(ragService, "askKnowledgeBase")
        .mockResolvedValue({
          output:
            "AI-BOS is an enterprise document intelligence platform.",
          provider: "gemini",
          model: "test-model",
          sources: [],
        });

      const response = await request(app)
        .post("/api/knowledge-base/ask")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          question: "What is AI-BOS?",
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.answer).toBe(
        "AI-BOS is an enterprise document intelligence platform."
      );

      expect(ragSpy).toHaveBeenCalledWith(
        "What is AI-BOS?",
        adminUser._id
      );
    }
  );

  // =====================================================
  // Empty Question
  // =====================================================

  it(
    "should reject an empty question",
    async () => {
      const response = await request(app)
        .post("/api/knowledge-base/ask")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          question: "",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Question is required"
      );
    }
  );

  // =====================================================
  // No Relevant Information
  // =====================================================

  it(
    "should return the no-match response when no relevant information exists",
    async () => {
      const ragSpy = vi
        .spyOn(ragService, "askKnowledgeBase")
        .mockResolvedValue({
          output:
            "I could not find this information in the uploaded document.",
          provider: "gemini",
          model: "retrieval-no-match",
          sources: [],
        });

      const response = await request(app)
        .post("/api/knowledge-base/ask")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          question: "What is unrelated information?",
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.answer).toBe(
        "I could not find this information in the uploaded document."
      );

      expect(ragSpy).toHaveBeenCalledWith(
        "What is unrelated information?",
        adminUser._id
      );
    }
  );

  // =====================================================
  // RAG Service Error
  // =====================================================

  it(
    "should handle a knowledge base service error",
    async () => {
      const ragSpy = vi
        .spyOn(ragService, "askKnowledgeBase")
        .mockRejectedValue(
          new Error("RAG service failed")
        );

      const response = await request(app)
        .post("/api/knowledge-base/ask")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          question: "What is AI-BOS?",
        });

      expect(response.status).toBeGreaterThanOrEqual(
        500
      );

      expect(response.body.success).toBe(false);

      expect(ragSpy).toHaveBeenCalledWith(
        "What is AI-BOS?",
        adminUser._id
      );
    }
  );

  // =====================================================
  // User Isolation
  // =====================================================

  it(
    "should pass the authenticated user's ID to the RAG service",
    async () => {
      const ragSpy = vi
        .spyOn(ragService, "askKnowledgeBase")
        .mockResolvedValue({
          output: "Test answer",
          provider: "gemini",
          model: "test-model",
          sources: [],
        });

      const response = await request(app)
        .post("/api/knowledge-base/ask")
        .set(
          "Authorization",
          `Bearer ${otherToken}`
        )
        .send({
          question: "What is AI-BOS?",
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(ragSpy).toHaveBeenCalledWith(
        "What is AI-BOS?",
        otherUser._id
      );

      const calledUserId =
        ragSpy.mock.calls[0][1];

      expect(String(calledUserId)).toBe(
        String(otherUser._id)
      );
    }
  );
});