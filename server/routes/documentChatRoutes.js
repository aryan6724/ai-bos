import express from "express";

import {
  askDocumentQuestion,
  getDocumentChatHistory,
  clearDocumentChatHistory,
  updateDocumentChatFeedback,
  regenerateDocumentChat,
} from "../controllers/documentChatController.js";

import { protect } from "../middleware/authMiddleware.js";
import { auditAction } from "../middleware/auditMiddleware.js";
import { aiRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* ===========================
   Ask Document Question
=========================== */

router.post(
  "/:documentId/ask",
  protect,
  aiRateLimiter,
  auditAction({
    action: "DOCUMENT_CHAT_ASKED",
    resourceType: "document-chat",
    description: "Asked an AI question about a document.",
    getResourceId: (req) => req.params.documentId,
    getMetadata: (req) => ({
      tool: "document-chat",
      questionLength:
        typeof req.body?.question === "string"
          ? req.body.question.length
          : 0,
    }),
  }),
  askDocumentQuestion
);

/* ===========================
   Chat History
=========================== */

router.get(
  "/:documentId",
  protect,
  getDocumentChatHistory
);

/* ===========================
   Clear History
=========================== */

router.delete(
  "/:documentId",
  protect,
  auditAction({
    action: "DOCUMENT_CHAT_CLEARED",
    resourceType: "document-chat",
    description: "Cleared document chat history.",
    getResourceId: (req) => req.params.documentId,
  }),
  clearDocumentChatHistory
);

/* ===========================
   Regenerate
=========================== */

router.post(
  "/:chatId/regenerate",
  protect,
  aiRateLimiter,
  auditAction({
    action: "DOCUMENT_CHAT_REGENERATED",
    resourceType: "document-chat",
    description: "Regenerated a document chat answer.",
    getResourceId: (req) => req.params.chatId,
  }),
  regenerateDocumentChat
);

/* ===========================
   Feedback
=========================== */

router.patch(
  "/:chatId/feedback",
  protect,
  auditAction({
    action: "DOCUMENT_CHAT_FEEDBACK_UPDATED",
    resourceType: "document-chat",
    description: "Updated document chat feedback.",
    getResourceId: (req) => req.params.chatId,
    getMetadata: (req) => ({
      feedback:
        req.body?.feedback === "like" ||
        req.body?.feedback === "dislike"
          ? req.body.feedback
          : null,
    }),
  }),
  updateDocumentChatFeedback
);

export default router;
