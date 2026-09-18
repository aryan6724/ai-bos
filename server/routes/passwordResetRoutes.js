import express from "express";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordResetController.js";
import { authRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/forgot", authRateLimiter, forgotPassword);
router.post("/reset", authRateLimiter, resetPassword);

export default router;
