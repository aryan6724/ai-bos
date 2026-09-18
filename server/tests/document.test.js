import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";

import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";

import app from "../app.js";

import Document from "../models/Document.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Document API", () => {
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
        fullName: "Document Test User",
        email: "document-test@example.com",
        companyName: "Document Test Company",
        password: "password123",
      });

    expect(registerResponse.status).toBe(201);

    userToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it("should reject document list access without authentication", async () => {
    const response = await request(app)
      .get("/api/documents");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should allow an authenticated user to get their documents", async () => {
    const response = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.documents)).toBe(
      true
    );
  });

  it("should reject document search without authentication", async () => {
    const response = await request(app)
      .post("/api/documents/search")
      .send({
        query: "test document",
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid document search requests", async () => {
    const response = await request(app)
      .post("/api/documents/search")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        query: "",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject document deletion without authentication", async () => {
    const fakeDocumentId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .delete(`/api/documents/${fakeDocumentId}`);

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject deletion of a document that does not belong to the user", async () => {
    const fakeDocumentId =
      "507f1f77bcf86cd799439011";

    const response = await request(app)
      .delete(`/api/documents/${fakeDocumentId}`)
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });

  it("should delete the authenticated user's own document", async () => {
    const testFilePath = path.join(
      process.cwd(),
      "tests",
      "test-document.txt"
    );

    await fs.writeFile(
      testFilePath,
      "Test document content"
    );

    const document = await Document.create({
  user: userId,
  originalName: "test-document.txt",
  fileName: "test-document.txt",
  mimeType: "text/plain",
  size: 22,
  storagePath: testFilePath,
  category: "general",
  status: "ready",
  isIndexed: true,
  isDeleted: false,
});

    const response = await request(app)
      .delete(`/api/documents/${document._id}`)
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const deletedDocument =
      await Document.findById(document._id);

    expect(deletedDocument).toBeDefined();

    expect(deletedDocument.isDeleted).toBe(true);
  });
});