import express from "express";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  toggleTeamMemberStatus,
  updateTeamMemberRole,
} from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { auditAction } from "../middleware/auditMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getTeamMembers);

router.post(
  "/",
  protect,
  adminOnly,
  auditAction({
    action: "TEAM_MEMBER_CREATED",
    resourceType: "team",
    description: (req) =>
      `Created team member ${req.body.email || "unknown user"}.`,
    getMetadata: (req) => ({
      email: req.body.email,
      role: req.body.role,
    }),
  }),
  createTeamMember
);

router.patch(
  "/:id/role",
  protect,
  adminOnly,
  auditAction({
    action: "TEAM_ROLE_UPDATED",
    resourceType: "team",
    description: (req) =>
      `Changed team member role to ${req.body.role}.`,
    getMetadata: (req) => ({
      newRole: req.body.role,
    }),
  }),
  updateTeamMemberRole
);

router.patch(
  "/:id/status",
  protect,
  adminOnly,
  auditAction({
    action: "TEAM_STATUS_TOGGLED",
    resourceType: "team",
    description: "Changed a team member's account status.",
  }),
  toggleTeamMemberStatus
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  auditAction({
    action: "TEAM_MEMBER_DELETED",
    resourceType: "team",
    description: "Deleted a team member.",
  }),
  deleteTeamMember
);

export default router;