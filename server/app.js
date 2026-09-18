import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

import documentChatRoutes from "./routes/documentChatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import knowledgeBaseRoutes from "./routes/knowledgeBaseRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";

import {
  globalApiLimiter,
} from "./middleware/rateLimitMiddleware.js";

import {
  errorHandler,
  notFound,
} from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

/* ===========================
   SECURITY
=========================== */

// Hide Express technology information
app.disable("x-powered-by");

// Add secure HTTP response headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ===========================
   CORS
=========================== */

const clientUrl = process.env.CLIENT_URL?.trim();

if (!clientUrl) {
  throw new Error("CLIENT_URL is missing in environment variables.");
}

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

/* ===========================
   BODY PARSERS
=========================== */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/* ===========================
   GLOBAL API RATE LIMITER
=========================== */

app.use("/api", globalApiLimiter);

/* ===========================
   ROOT
=========================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI-BOS API is running",
  });
});

/* ===========================
   HEALTH CHECK
=========================== */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server health check passed",
    timestamp: new Date().toISOString(),
  });
});

/* ===========================
   API ROUTES
=========================== */

app.use("/api/auth", authRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/document-chat", documentChatRoutes);

app.use("/api/team", teamRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/audit-logs", auditLogRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/knowledge-base", knowledgeBaseRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/auth", passwordResetRoutes);

/* ===========================
   ERROR HANDLING
=========================== */

app.use(notFound);

app.use(errorHandler);

export default app;
