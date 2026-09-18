import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { aiRateLimiter } from "../middleware/rateLimitMiddleware.js";

import { askKnowledge } from "../controllers/knowledgeBaseController.js";

const router = express.Router();

router.post(
  "/ask",
  protect,
  aiRateLimiter,
  askKnowledge
);

export default router;
