import express from "express";
import {
  changePassword,
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { auditAction } from "../middleware/auditMiddleware.js";

const router = express.Router();

router.get("/", protect, getProfile);

router.patch(
  "/",
  protect,
  auditAction({
    action: "PROFILE_UPDATED",
    resourceType: "profile",
    description: "Updated account profile information.",
  }),
  updateProfile
);

router.patch(
  "/password",
  protect,
  auditAction({
    action: "PASSWORD_CHANGED",
    resourceType: "security",
    description: "Changed account password.",
  }),
  changePassword
);

export default router;