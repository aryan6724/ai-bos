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

describe("Team API", () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Admin User",
        email: "admin@example.com",
        companyName: "Test Company",
        password: "password123",
      });

    expect(registerResponse.status).toBe(201);

    adminToken = registerResponse.body.token;

    adminUser = await User.findOne({
      email: "admin@example.com",
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // ======================================================
  // Authentication
  // ======================================================

  it("should reject team access without authentication", async () => {
    const response = await request(app)
      .get("/api/team");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // Admin Authorization
  // ======================================================

  it("should reject team access for a non-admin user", async () => {
    const employee = await User.create({
      fullName: "Employee User",
      email: "employee@example.com",
      companyName: "Test Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "E",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "employee@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(200);

    const employeeToken =
      loginResponse.body.token;

    const response = await request(app)
      .get("/api/team")
      .set(
        "Authorization",
        `Bearer ${employeeToken}`
      );

    expect(response.status).toBe(403);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // Get Team Members
  // ======================================================

  it("should allow an admin to get team members", async () => {
    await User.create({
      fullName: "Team Employee",
      email: "team@example.com",
      companyName: "Test Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "T",
    });

    const response = await request(app)
      .get("/api/team")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(2);

    expect(
      Array.isArray(response.body.users)
    ).toBe(true);

    expect(
      response.body.users.some(
        (user) =>
          user.email === "team@example.com"
      )
    ).toBe(true);
  });

  // ======================================================
  // Create Team Member
  // ======================================================

  it("should allow an admin to create a team member", async () => {
    const response = await request(app)
      .post("/api/team")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        fullName: "New Employee",
        email: "newemployee@example.com",
        role: "employee",
        password: "password123",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Team member created successfully"
    );

    expect(response.body.user).toBeDefined();

    expect(response.body.user.email).toBe(
      "newemployee@example.com"
    );

    expect(response.body.user.role).toBe(
      "employee"
    );

    expect(
      response.body.user.password
    ).toBeUndefined();
  });

  it("should reject creating a team member with an invalid role", async () => {
    const response = await request(app)
      .post("/api/team")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        fullName: "Invalid Role User",
        email: "invalid-role@example.com",
        role: "superadmin",
        password: "password123",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid user role"
    );
  });

  it("should reject creating a duplicate team member", async () => {
    await User.create({
      fullName: "Existing User",
      email: "existing@example.com",
      companyName: "Test Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "E",
    });

    const response = await request(app)
      .post("/api/team")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        fullName: "Duplicate User",
        email: "existing@example.com",
        role: "employee",
        password: "password123",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "User already exists with this email"
    );
  });

  // ======================================================
  // Update Role
  // ======================================================

  it("should allow an admin to update a team member role", async () => {
    const member = await User.create({
      fullName: "Role User",
      email: "role@example.com",
      companyName: "Test Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "R",
    });

    const response = await request(app)
      .patch(
        `/api/team/${member._id}/role`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        role: "manager",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "User role updated successfully"
    );

    expect(response.body.user.role).toBe(
      "manager"
    );
  });

  it("should reject an invalid team member ID", async () => {
    const response = await request(app)
      .patch(
        "/api/team/not-a-valid-id/role"
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        role: "manager",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid user ID"
    );
  });

  // ======================================================
  // Toggle Status
  // ======================================================

  it("should allow an admin to toggle a team member status", async () => {
    const member = await User.create({
      fullName: "Status User",
      email: "status@example.com",
      companyName: "Test Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "S",
    });

    const response = await request(app)
      .patch(
        `/api/team/${member._id}/status`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "User deactivated successfully"
    );

    expect(
      response.body.user.isActive
    ).toBe(false);
  });

  it("should reject an admin from deactivating their own account", async () => {
    const response = await request(app)
      .patch(
        `/api/team/${adminUser._id}/status`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "You cannot deactivate your own account"
    );
  });

  // ======================================================
  // Delete Team Member
  // ======================================================

  it("should allow an admin to delete a team member", async () => {
    const member = await User.create({
      fullName: "Delete User",
      email: "delete@example.com",
      companyName: "Test Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "D",
    });

    const response = await request(app)
      .delete(
        `/api/team/${member._id}`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Team member deleted successfully"
    );

    const deletedUser =
      await User.findById(member._id);

    expect(deletedUser).toBeNull();
  });

  it("should reject an admin from deleting their own account", async () => {
    const response = await request(app)
      .delete(
        `/api/team/${adminUser._id}`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "You cannot delete your own account"
    );
  });

  // ======================================================
  // Cross Company Protection
  // ======================================================

  it("should not allow an admin to modify another company's user", async () => {
    const otherCompanyUser =
      await User.create({
        fullName: "Other Company User",
        email: "other@example.com",
        companyName: "Other Company",
        password: "password123",
        role: "employee",
        isActive: true,
        avatarInitial: "O",
      });

    const response = await request(app)
      .patch(
        `/api/team/${otherCompanyUser._id}/role`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        role: "manager",
      });

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "User not found"
    );

    const unchangedUser =
      await User.findById(
        otherCompanyUser._id
      );

    expect(unchangedUser.role).toBe(
      "employee"
    );
  });

  it("should not allow an admin to delete another company's user", async () => {
    const otherCompanyUser =
      await User.create({
        fullName: "Other Delete User",
        email: "other-delete@example.com",
        companyName: "Other Company",
        password: "password123",
        role: "employee",
        isActive: true,
        avatarInitial: "O",
      });

    const response = await request(app)
      .delete(
        `/api/team/${otherCompanyUser._id}`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "User not found"
    );

    const existingUser =
      await User.findById(
        otherCompanyUser._id
      );

    expect(existingUser).not.toBeNull();
  });
});