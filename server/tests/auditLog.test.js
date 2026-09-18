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
import AuditLog from "../models/AuditLog.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from "./setup.js";

describe("Audit Log API", () => {
  let adminToken;
  let employeeToken;
  let adminUser;
  let employeeUser;
  let otherCompanyUser;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // ======================================================
    // Create Admin
    // ======================================================

    const adminResponse = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Audit Admin",
        email: "auditadmin@example.com",
        companyName: "Audit Company",
        password: "password123",
      });

    expect(adminResponse.status).toBe(201);

    adminToken = adminResponse.body.token;

    adminUser = await User.findOne({
      email: "auditadmin@example.com",
    });

    // ======================================================
    // Create Employee
    // ======================================================

    const employee = await User.create({
      fullName: "Audit Employee",
      email: "auditemployee@example.com",
      companyName: "Audit Company",
      password: "password123",
      role: "employee",
      avatarInitial: "A",
      isActive: true,
    });

    employeeUser = employee;

    const employeeLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "auditemployee@example.com",
        password: "password123",
      });

    expect(employeeLogin.status).toBe(200);

    employeeToken = employeeLogin.body.token;

    // ======================================================
    // Create another company user
    // ======================================================

    otherCompanyUser = await User.create({
      fullName: "Other Company Admin",
      email: "otheradmin@example.com",
      companyName: "Other Company",
      password: "password123",
      role: "admin",
      avatarInitial: "O",
      isActive: true,
    });

    // ======================================================
    // Seed Audit Logs
    // ======================================================
    await AuditLog.deleteMany({});

    await AuditLog.create([
      {
        user: adminUser._id,
        companyName: "Audit Company",
        action: "PROFILE_UPDATED",
        resourceType: "profile",
        resourceId: String(adminUser._id),
        description: "Updated account profile information.",
        method: "PATCH",
        path: "/api/profile",
        statusCode: 200,
        outcome: "success",
        metadata: {
          type: "profile",
        },
      },

      {
        user: adminUser._id,
        companyName: "Audit Company",
        action: "DOCUMENT_UPLOADED",
        resourceType: "document",
        resourceId: "document-001",
        description: "Uploaded test-document.pdf.",
        method: "POST",
        path: "/api/documents/upload",
        statusCode: 201,
        outcome: "success",
        metadata: {
          filename: "test-document.pdf",
        },
      },

      {
        user: adminUser._id,
        companyName: "Audit Company",
        action: "DOCUMENT_SEARCHED",
        resourceType: "document",
        resourceId: "",
        description: "Performed a semantic search across uploaded documents.",
        method: "POST",
        path: "/api/documents/search",
        statusCode: 200,
        outcome: "success",
        metadata: {
          queryLength: 25,
        },
      },

      {
        user: adminUser._id,
        companyName: "Audit Company",
        action: "DOCUMENT_DELETED",
        resourceType: "document",
        resourceId: "document-002",
        description: "Deleted document document-002.",
        method: "DELETE",
        path: "/api/documents/document-002",
        statusCode: 404,
        outcome: "failure",
        metadata: {},
      },

      {
        user: adminUser._id,
        companyName: "Audit Company",
        action: "TEAM_MEMBER_CREATED",
        resourceType: "team",
        resourceId: "",
        description: "Created team member employee@example.com.",
        method: "POST",
        path: "/api/team",
        statusCode: 201,
        outcome: "success",
        metadata: {
          role: "employee",
        },
      },

      // Different company log
      {
        user: otherCompanyUser._id,
        companyName: "Other Company",
        action: "SECRET_ACTION",
        resourceType: "other",
        resourceId: "other-001",
        description: "This log belongs to another company.",
        method: "POST",
        path: "/api/other",
        statusCode: 200,
        outcome: "success",
        metadata: {},
      },
    ]);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // ======================================================
  // Authentication
  // ======================================================

  it("should reject audit log access without authentication", async () => {
    const response = await request(app)
      .get("/api/audit-logs");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // Admin Access
  // ======================================================

  it("should allow an authenticated admin to access audit logs", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.logs)).toBe(true);

    expect(response.body.pagination).toBeDefined();
  });

  // ======================================================
  // Employee Access
  // ======================================================

  it("should reject audit log access for non-admin users", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .set(
        "Authorization",
        `Bearer ${employeeToken}`
      );

    expect(response.status).toBe(403);

    expect(response.body.success).toBe(false);
  });

  // ======================================================
  // Company Isolation
  // ======================================================

  it("should return only audit logs belonging to the admin's company", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(5);

    for (const log of response.body.logs) {
      expect(log.companyName).toBe(
        "Audit Company"
      );
    }

    const secretLog = response.body.logs.find(
      (log) =>
        log.action === "SECRET_ACTION"
    );

    expect(secretLog).toBeUndefined();
  });

  // ======================================================
  // Search
  // ======================================================

  it("should filter audit logs by search text", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        search: "profile",
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(1);

    expect(
      response.body.logs[0].action
    ).toBe("PROFILE_UPDATED");
  });

  // ======================================================
  // Action Filter
  // ======================================================

  it("should filter audit logs by action", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        action: "DOCUMENT_UPLOADED",
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(1);

    expect(
      response.body.logs[0].action
    ).toBe("DOCUMENT_UPLOADED");
  });

  // ======================================================
  // Resource Filter
  // ======================================================

  it("should filter audit logs by resource type", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        resourceType: "document",
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(3);

    for (const log of response.body.logs) {
      expect(log.resourceType).toBe(
        "document"
      );
    }
  });

  // ======================================================
  // Outcome Filter
  // ======================================================

  it("should filter audit logs by success outcome", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        outcome: "success",
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(4);

    for (const log of response.body.logs) {
      expect(log.outcome).toBe("success");
    }
  });

  it("should filter audit logs by failure outcome", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        outcome: "failure",
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(1);

    expect(
      response.body.logs[0].outcome
    ).toBe("failure");
  });

  // ======================================================
  // Pagination
  // ======================================================

  it("should paginate audit logs correctly", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        page: 1,
        limit: 2,
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(2);

    expect(
      response.body.pagination.page
    ).toBe(1);

    expect(
      response.body.pagination.limit
    ).toBe(2);

    expect(
      response.body.pagination.total
    ).toBe(5);

    expect(
      response.body.pagination.pages
    ).toBe(3);

    expect(
      response.body.pagination.hasPrevious
    ).toBe(false);

    expect(
      response.body.pagination.hasNext
    ).toBe(true);
  });

  // ======================================================
  // Pagination Page 2
  // ======================================================

  it("should return the second audit log page correctly", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({
        page: 2,
        limit: 2,
      })
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBe(2);

    expect(
      response.body.pagination.page
    ).toBe(2);

    expect(
      response.body.pagination.hasPrevious
    ).toBe(true);

    expect(
      response.body.pagination.hasNext
    ).toBe(true);
  });

  // ======================================================
  // Sensitive Data
  // ======================================================

  it("should return populated user information without password", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.logs.length).toBeGreaterThan(0);

    const log = response.body.logs[0];

    expect(log.user).toBeDefined();

    expect(log.user.email).toBe(
      "auditadmin@example.com"
    );

    expect(log.user.fullName).toBe(
      "Audit Admin"
    );

    expect(log.user.password).toBeUndefined();
  });
});