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

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Authentication", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it("should register a new user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test User",
        email: "test@example.com",
        companyName: "Test Company",
        password: "password123",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.token).toBeDefined();

    expect(response.body.user).toBeDefined();

    expect(response.body.user.email).toBe(
      "test@example.com"
    );

    expect(response.body.user.fullName).toBe(
      "Test User"
    );
  });

  it("should login an existing user successfully", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Login User",
        email: "login@example.com",
        companyName: "Test Company",
        password: "password123",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.token).toBeDefined();

    expect(response.body.user).toBeDefined();

    expect(response.body.user.email).toBe(
      "login@example.com"
    );
  });

  it("should reject login with an incorrect password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Wrong Password User",
        email: "wrong@example.com",
        companyName: "Test Company",
        password: "password123",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid email or password"
    );
  });

  it("should reject protected access without a token", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });
});