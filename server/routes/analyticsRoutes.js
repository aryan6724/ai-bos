import express from "express";

import {
  getDashboardOverview,
  getFullAnalytics,
} from "../controllers/analyticsController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===========================
   Dashboard Analytics
=========================== */

router.get(
  "/overview",
  protect,
  getDashboardOverview
);

/* ===========================
   Full Analytics
=========================== */

router.get(
  "/full",
  protect,
  getFullAnalytics
);

export default router;