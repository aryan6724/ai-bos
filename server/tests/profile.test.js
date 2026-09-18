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

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Profile API", () => {
  let userToken;
  let user;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Profile User",
        email: "profile@example.com",
        companyName: "Profile Company",
        password: "password123",
      });

    expect(registerResponse.status).toBe(201);

    userToken = registerResponse.body.token;

    user = await User.findOne({
      email: "profile@example.com",
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // ======================================================
  // Authentication
  // ======================================================

  it("should reject getting profile without authentication", async () => {
    const response = await request(app)
      .get("/api/profile");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject updating profile without authentication", async () => {
    const response = await request(app)
      .patch("/api/profile")
      .send({
        fullName: "Updated User",
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject changing password without authentication", async () => {
    const response = await request(app)
      .patch("/api/profile/password")
      .send({
        currentPassword: "password123",
        newPassword: "newpassword123",
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // Get Profile
  // ======================================================

  it("should allow an authenticated user to get their profile", async () => {
    const response = await request(app)
      .get("/api/profile")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.user).toBeDefined();

    expect(response.body.user.email).toBe(
      "profile@example.com"
    );

    expect(response.body.user.fullName).toBe(
      "Profile User"
    );

    expect(response.body.user.companyName).toBe(
      "Profile Company"
    );

    expect(
      response.body.user.password
    ).toBeUndefined();
  });

  // ======================================================
  // Update Profile
  // ======================================================

  it("should allow an authenticated user to update their profile", async () => {
    const response = await request(app)
      .patch("/api/profile")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        fullName: "Updated Profile User",
        companyName: "Updated Company",
        avatarInitial: "U",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Profile updated successfully"
    );

    expect(response.body.user.fullName).toBe(
      "Updated Profile User"
    );

    expect(response.body.user.companyName).toBe(
      "Updated Company"
    );

    expect(response.body.user.avatarInitial).toBe(
      "U"
    );

    expect(response.body.user.email).toBe(
      "profile@example.com"
    );

    expect(
      response.body.user.password
    ).toBeUndefined();
  });

  // ======================================================
  // Password Validation
  // ======================================================

  it("should reject password change when fields are missing", async () => {
    const response = await request(app)
      .patch("/api/profile/password")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Current password and new password are required"
    );
  });

  it("should reject a password shorter than 6 characters", async () => {
    const response = await request(app)
      .patch("/api/profile/password")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        currentPassword: "password123",
        newPassword: "123",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "New password must be at least 6 characters long"
    );
  });

  it("should reject an incorrect current password", async () => {
    const response = await request(app)
      .patch("/api/profile/password")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Current password is incorrect"
    );
  });

  // ======================================================
  // Change Password
  // ======================================================

  it("should allow an authenticated user to change their password", async () => {
    const response = await request(app)
      .patch("/api/profile/password")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        currentPassword: "password123",
        newPassword: "newpassword123",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Password changed successfully"
    );
  });

  it("should allow login with the new password after changing it", async () => {
    const changeResponse = await request(app)
      .patch("/api/profile/password")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        currentPassword: "password123",
        newPassword: "newpassword123",
      });

    expect(changeResponse.status).toBe(200);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile@example.com",
        password: "newpassword123",
      });

    expect(loginResponse.status).toBe(200);

    expect(loginResponse.body.success).toBe(true);

    expect(
      loginResponse.body.token
    ).toBeDefined();
  });

  // ======================================================
  // Old Password
  // ======================================================

  it("should reject the old password after it has been changed", async () => {
    await request(app)
      .patch("/api/profile/password")
      .set(
        "Authorization",
        `Bearer ${userToken}`
      )
      .send({
        currentPassword: "password123",
        newPassword: "newpassword123",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(401);

    expect(loginResponse.body.success).toBe(false);

    expect(loginResponse.body.message).toBe(
      "Invalid email or password"
    );
  });
});