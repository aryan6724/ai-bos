import express from "express";

import { getAuditLogs } from "../controllers/auditLogController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAuditLogs);

export default router;
