import express from "express";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Public authentication routes
router.post(
  "/register",
  authRateLimiter,
  registerUser
);

router.post(
  "/login",
  authRateLimiter,
  loginUser
);

// Protected route
router.get(
  "/me",
  protect,
  getCurrentUser
);

export default router;