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

import User from "../models/User.js";
import Generation from "../models/Generation.js";
import Document from "../models/Document.js";
import DocumentChat from "../models/DocumentChat.js";

import { generateToken } from "../utils/generateToken.js";

describe("Analytics API", () => {
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
      fullName: "Analytics Admin",
      email: "analytics-admin@example.com",
      companyName: "Analytics Company",
      password: "password123",
      role: "admin",
      isActive: true,
      avatarInitial: "A",
    });

    otherUser = await User.create({
      fullName: "Other Analytics User",
      email: "analytics-other@example.com",
      companyName: "Other Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "O",
    });

    adminToken = generateToken(adminUser._id);
    otherToken = generateToken(otherUser._id);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  // =====================================================
  // Authentication
  // =====================================================

  it("should reject overview access without authentication", async () => {
    const response = await request(app)
      .get("/api/analytics/overview");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject full analytics access without authentication", async () => {
    const response = await request(app)
      .get("/api/analytics/full");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // =====================================================
  // Overview
  // =====================================================

  it("should return dashboard overview for authenticated user", async () => {
    const response = await request(app)
      .get("/api/analytics/overview")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.stats).toBeDefined();

    expect(
      Array.isArray(response.body.stats)
    ).toBe(true);

    expect(response.body.stats.length).toBe(4);

    expect(response.body.usageBars).toBeDefined();

    expect(
      Array.isArray(response.body.usageBars)
    ).toBe(true);

    expect(response.body.usageBars.length).toBe(7);

    expect(response.body.summary).toBeDefined();

    expect(
      response.body.recentActivities
    ).toBeDefined();

    expect(
      Array.isArray(response.body.recentActivities)
    ).toBe(true);
  });

  // =====================================================
  // Overview Empty Database
  // =====================================================

  it("should return zero analytics when no user data exists", async () => {
    const response = await request(app)
      .get("/api/analytics/overview")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    const generationStat =
      response.body.stats.find(
        (item) => item.key === "generations"
      );

    const documentStat =
      response.body.stats.find(
        (item) => item.key === "documents"
      );

    const chatStat =
      response.body.stats.find(
        (item) => item.key === "chats"
      );

    expect(generationStat.value).toBe("0");

    expect(documentStat.value).toBe("0");

    expect(chatStat.value).toBe("0");
  });

  // =====================================================
  // Full Analytics
  // =====================================================

  it("should return full analytics for authenticated user", async () => {
    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.overview).toBeDefined();

    expect(response.body.weeklyUsage).toBeDefined();

    expect(
      Array.isArray(response.body.weeklyUsage)
    ).toBe(true);

    expect(response.body.weeklyUsage.length).toBe(7);

    expect(response.body.generationTypes).toBeDefined();

    expect(
      Array.isArray(response.body.generationTypes)
    ).toBe(true);

    expect(response.body.documentCategories).toBeDefined();

    expect(
      Array.isArray(response.body.documentCategories)
    ).toBe(true);

    expect(response.body.teamRoles).toBeDefined();

    expect(
      Array.isArray(response.body.teamRoles)
    ).toBe(true);

    expect(response.body.recentActivities).toBeDefined();

    expect(
      Array.isArray(response.body.recentActivities)
    ).toBe(true);
  });

  // =====================================================
  // User Data Isolation
  // =====================================================

  it("should only count generations belonging to the logged-in user", async () => {
    await Generation.create({
      user: adminUser._id,
      type: "resume",
      title: "Admin Resume",
      input: "Admin input",
      output: "Admin output",
      provider: "gemini",
      model: "test-model",
    });

    await Generation.create({
      user: otherUser._id,
      type: "resume",
      title: "Other Resume",
      input: "Other input",
      output: "Other output",
      provider: "gemini",
      model: "test-model",
    });

    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(
      response.body.overview.totalGenerations
    ).toBe(1);
  });

  // =====================================================
  // Document Isolation
  // =====================================================

  it("should only count documents belonging to the logged-in user", async () => {
    await Document.create({
      user: adminUser._id,
      originalName: "admin-document.pdf",
      fileName: "admin-document.pdf",
      mimeType: "application/pdf",
      size: 1000,
      storagePath: "test/admin-document.pdf",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    await Document.create({
      user: otherUser._id,
      originalName: "other-document.pdf",
      fileName: "other-document.pdf",
      mimeType: "application/pdf",
      size: 1000,
      storagePath: "test/other-document.pdf",
      category: "general",
      status: "ready",
      isIndexed: true,
      isDeleted: false,
    });

    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(
      response.body.overview.totalDocuments
    ).toBe(1);
  });

  // =====================================================
  // Team / Company Isolation
  // =====================================================

  it("should count team members from the authenticated user's company", async () => {
    await User.create({
      fullName: "Company Employee",
      email: "company-employee@example.com",
      companyName: "Analytics Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "C",
    });

    await User.create({
      fullName: "Other Company Employee",
      email: "other-employee@example.com",
      companyName: "Other Company",
      password: "password123",
      role: "employee",
      isActive: true,
      avatarInitial: "E",
    });

    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(
      response.body.overview.totalTeamMembers
    ).toBe(2);
  });

  // =====================================================
  // Active Team Members
  // =====================================================

  it("should count active team members correctly", async () => {
    await User.create({
      fullName: "Inactive Employee",
      email: "inactive@example.com",
      companyName: "Analytics Company",
      password: "password123",
      role: "employee",
      isActive: false,
      avatarInitial: "I",
    });

    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(
      response.body.overview.totalTeamMembers
    ).toBe(2);

    expect(
      response.body.overview.activeTeamMembers
    ).toBe(1);
  });

  // =====================================================
  // Generation Type Analytics
  // =====================================================

  it("should return generation type analytics", async () => {
    await Generation.create([
      {
        user: adminUser._id,
        type: "resume",
        title: "Resume 1",
        input: "Input",
        output: "Output",
        provider: "gemini",
        model: "test-model",
      },
      {
        user: adminUser._id,
        type: "resume",
        title: "Resume 2",
        input: "Input",
        output: "Output",
        provider: "gemini",
        model: "test-model",
      },
      {
        user: adminUser._id,
        type: "email",
        title: "Email 1",
        input: "Input",
        output: "Output",
        provider: "gemini",
        model: "test-model",
      },
    ]);

    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    const resumeType =
      response.body.generationTypes.find(
        (item) => item.label === "resume"
      );

    const emailType =
      response.body.generationTypes.find(
        (item) => item.label === "email"
      );

    expect(resumeType.count).toBe(2);

    expect(emailType.count).toBe(1);
  });

  // =====================================================
  // Company Isolation
  // =====================================================

  it("should not include another company's team members", async () => {
    await User.create({
      fullName: "Other Company Admin",
      email: "other-admin@example.com",
      companyName: "Other Company",
      password: "password123",
      role: "admin",
      isActive: true,
      avatarInitial: "O",
    });

    await User.create({
      fullName: "Other Company Manager",
      email: "other-manager@example.com",
      companyName: "Other Company",
      password: "password123",
      role: "manager",
      isActive: true,
      avatarInitial: "M",
    });

    const response = await request(app)
      .get("/api/analytics/full")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(
      response.body.overview.totalTeamMembers
    ).toBe(1);

    const totalRoles =
      response.body.teamRoles.reduce(
        (total, item) => total + item.count,
        0
      );

    expect(totalRoles).toBe(1);
  });

  // =====================================================
  // Invalid Route
  // =====================================================

  it("should reject an invalid analytics route", async () => {
    const response = await request(app)
      .get("/api/analytics/invalid")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });

  // =====================================================
  // Different User
  // =====================================================

  it("should return analytics scoped to the logged-in user", async () => {
    await Generation.create({
      user: adminUser._id,
      type: "report",
      title: "Admin Report",
      input: "Admin input",
      output: "Admin output",
      provider: "gemini",
      model: "test-model",
    });

    await Generation.create({
      user: otherUser._id,
      type: "email",
      title: "Other Email",
      input: "Other input",
      output: "Other output",
      provider: "gemini",
      model: "test-model",
    });

    const response = await request(app)
      .get("/api/analytics/overview")
      .set(
        "Authorization",
        `Bearer ${otherToken}`
      );

    expect(response.status).toBe(200);

    const generationStat =
      response.body.stats.find(
        (item) => item.key === "generations"
      );

    expect(generationStat.value).toBe("1");
  });
});