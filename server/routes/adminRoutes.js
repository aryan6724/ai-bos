import express from "express";

import {
  getAdminOverview,
  getAdminRoleDistribution,
  getAdminUsers,
  getAdminDocuments,
  getAdminActivity,
  getAdminAuditActivity,
  getAdminIntelligence,
  updateAdminUserStatus,
  updateAdminUserRole,
  getAdminToolUsage,
  getAdminAnalytics,
} from "../controllers/adminController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// ADMIN AUTHORIZATION
// ======================================================
// Every route in this file requires:
// 1. Valid JWT
// 2. Active user
// 3. admin role
// ======================================================

const adminOnly = [
  protect,
  authorizeRoles("admin"),
];

// ======================================================
// COMPLETE ADMIN INTELLIGENCE
// ======================================================

router.get(
  "/intelligence",
  ...adminOnly,
  getAdminIntelligence
);

// ======================================================
// ADMIN OVERVIEW
// ======================================================

router.get(
  "/overview",
  ...adminOnly,
  getAdminOverview
);

// ======================================================
// ROLE DISTRIBUTION
// ======================================================

router.get(
  "/roles",
  ...adminOnly,
  getAdminRoleDistribution
);

// ======================================================
// USERS
// ======================================================

router.get(
  "/users",
  ...adminOnly,
  getAdminUsers
);

// ======================================================
// UPDATE USER STATUS
// ======================================================

router.patch(
  "/users/:id/status",
  ...adminOnly,
  updateAdminUserStatus
);

// ======================================================
// UPDATE USER ROLE
// ======================================================

router.patch(
  "/users/:id/role",
  ...adminOnly,
  updateAdminUserRole
);

// ======================================================
// DOCUMENTS
// ======================================================

router.get(
  "/documents",
  ...adminOnly,
  getAdminDocuments
);

// ======================================================
// AI ACTIVITY
// ======================================================

router.get(
  "/activity",
  ...adminOnly,
  getAdminActivity
);

// ======================================================
// AI TOOL USAGE
// ======================================================

router.get(
  "/tool-usage",
  ...adminOnly,
  getAdminToolUsage
);

// ======================================================
// ADMIN ANALYTICS
// ======================================================

router.get(
  "/analytics",
  ...adminOnly,
  getAdminAnalytics
);

// ======================================================
// AUDIT ACTIVITY
// ======================================================

router.get(
  "/audit-activity",
  ...adminOnly,
  getAdminAuditActivity
);

export default router;