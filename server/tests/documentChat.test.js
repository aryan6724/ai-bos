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

import Document from "../models/Document.js";
import DocumentChat from "../models/DocumentChat.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Document Chat API", () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Document Chat User",
        email: "document-chat@example.com",
        companyName: "Document Chat Company",
        password: "password123",
      });

    expect(registerResponse.status).toBe(201);

    userToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it("should reject asking a document question without authentication", async () => {
    const documentId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .post(`/api/document-chat/${documentId}/ask`)
      .send({
        question: "What is this document about?",
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject chat history access without authentication", async () => {
    const documentId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .get(
        `/api/document-chat/${documentId}/history`
      );

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject clearing chat history without authentication", async () => {
    const documentId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .delete(
        `/api/document-chat/${documentId}/history`
      );

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid document ID when requesting chat history", async () => {
    const response = await request(app)
      .get(
        "/api/document-chat/invalid-document-id/history"
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Document not found"
    );
  });

  it("should reject an empty document question", async () => {
    const document = await Document.create({
      user: userId,
      originalName: "chat-test.txt",
      fileName: "chat-test.txt",
      mimeType: "text/plain",
      size: 20,
      storagePath: "test-storage/test-document.txt",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    const response = await request(app)
      .post(
        `/api/document-chat/${document._id}/ask`
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        question: "",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Question is required"
    );
  });

  it("should reject chat history for a document not owned by the user", async () => {
    const anotherUserResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Another User",
        email: "another-chat@example.com",
        companyName: "Another Company",
        password: "password123",
      });

    expect(anotherUserResponse.status).toBe(201);

    const anotherUserId =
      anotherUserResponse.body.user.id;

    const document = await Document.create({
      user: anotherUserId,
      originalName: "private.txt",
      fileName: "private.txt",
      mimeType: "text/plain",
      size: 20,
      storagePath: "test-storage/test-document.txt",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    const response = await request(app)
      .get(
        `/api/document-chat/${document._id}/history`
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Document not found"
    );
  });

  it("should return only the authenticated user's chat history", async () => {
    const document = await Document.create({
      user: userId,
      originalName: "history.txt",
      fileName: "history.txt",
      mimeType: "text/plain",
      size: 20,
      storagePath: "test-storage/test-document.txt",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    await DocumentChat.create({
      user: userId,
      document: document._id,
      question: "What is this document?",
      answer: "This is a test document.",
      provider: "gemini",
      model: "test-model",
      sources: [],
      feedback: null,
    });

    const response = await request(app)
      .get(
        `/api/document-chat/${document._id}/history`
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(1);

    expect(Array.isArray(response.body.chats)).toBe(
      true
    );

    expect(response.body.chats[0].question).toBe(
      "What is this document?"
    );
  });

  it("should clear the authenticated user's own chat history", async () => {
    const document = await Document.create({
      user: userId,
      originalName: "clear.txt",
      fileName: "clear.txt",
      mimeType: "text/plain",
      size: 20,
      storagePath: "test-storage/test-document.txt",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    await DocumentChat.create({
      user: userId,
      document: document._id,
      question: "Test question",
      answer: "Test answer",
      provider: "gemini",
      model: "test-model",
      sources: [],
      feedback: null,
    });

    const response = await request(app)
      .delete(
        `/api/document-chat/${document._id}/history`
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const remainingChats =
      await DocumentChat.countDocuments({
        user: userId,
        document: document._id,
      });

    expect(remainingChats).toBe(0);
  });

  it("should reject invalid chat feedback", async () => {
    const document = await Document.create({
      user: userId,
      originalName: "feedback.txt",
      fileName: "feedback.txt",
      mimeType: "text/plain",
      size: 20,
      storagePath: "test-storage/test-document.txt",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    const chat = await DocumentChat.create({
      user: userId,
      document: document._id,
      question: "Test question",
      answer: "Test answer",
      provider: "gemini",
      model: "test-model",
      sources: [],
      feedback: null,
    });

    const response = await request(app)
      .patch(
        `/api/document-chat/${chat._id}/feedback`
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        feedback: "invalid",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid feedback value"
    );
  });

  it("should update feedback for the authenticated user's own chat", async () => {
    const document = await Document.create({
      user: userId,
      originalName: "feedback-own.txt",
      fileName: "feedback-own.txt",
      mimeType: "text/plain",
      size: 20,
      storagePath: "test-storage/test-document.txt",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    const chat = await DocumentChat.create({
      user: userId,
      document: document._id,
      question: "Test question",
      answer: "Test answer",
      provider: "gemini",
      model: "test-model",
      sources: [],
      feedback: null,
    });

    const response = await request(app)
      .patch(
        `/api/document-chat/${chat._id}/feedback`
      )
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        feedback: "like",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.chat.feedback).toBe(
      "like"
    );

    const updatedChat =
      await DocumentChat.findById(chat._id);

    expect(updatedChat.feedback).toBe("like");
  });

  it("should reject feedback update without authentication", async () => {
    const fakeChatId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .patch(
        `/api/document-chat/${fakeChatId}/feedback`
      )
      .send({
        feedback: "like",
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });
});