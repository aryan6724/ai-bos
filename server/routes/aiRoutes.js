import express from "express";

import {
  generateDocument,
  getMyGenerations,
  deleteGeneration,
  deleteAllGenerations,
  chatWithAI,
  chatWithAIStream,
  regenerateConversationMessageStream,
  improveText,
  summarizeText,
  rewriteText,
  translateText,
  analyzeDocument,
  getAnalysisHistory,
  getAnalysisHistoryById,
  deleteAnalysisHistory,
} from "../controllers/aiController.js";

import { protect } from "../middleware/authMiddleware.js";
import { auditAction } from "../middleware/auditMiddleware.js";
import { aiRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post(
  "/generate",
  protect,
  aiRateLimiter,
  auditAction({
    action: "AI_REQUEST",
    resourceType: "ai-generation",
    description: "Requested AI document generation.",
    getMetadata: (req) => ({
      type: req.body?.type || "unknown",
    }),
  }),
  generateDocument
);

router.post(
  "/tools/improve-text",
  protect,
  auditAction({
    action: "AI_TEXT_IMPROVED",
    resourceType: "ai-tool",
    description: "Used the AI text improver tool.",
    getMetadata: (req) => ({
      tool: "text-improver",
      mode: req.body?.mode || "improve",
      tone: req.body?.tone || "professional",
      textLength:
        typeof req.body?.text === "string"
          ? req.body.text.length
          : 0,
    }),
  }),
  improveText
);

router.post(
  "/tools/summarize",
  protect,
  auditAction({
    action: "AI_TEXT_SUMMARIZED",
    resourceType: "ai-tool",
    description: "Used the AI text summarizer tool.",
    getMetadata: (req) => ({
      tool: "text-summarizer",
      mode: req.body?.mode || "quick",
      tone: req.body?.tone || "professional",
      textLength:
        typeof req.body?.text === "string"
          ? req.body.text.length
          : 0,
    }),
  }),
  summarizeText
);

router.post(
  "/tools/rewrite-text",
  protect,
  auditAction({
    action: "AI_TEXT_REWRITTEN",
    resourceType: "ai-tool",
    description: "Used the AI text rewriter tool.",
    getMetadata: (req) => ({
      tool: "text-rewriter",
      mode: req.body?.mode || "paraphrase",
      tone: req.body?.tone || "professional",
      textLength:
        typeof req.body?.text === "string"
          ? req.body.text.length
          : 0,
    }),
  }),
  rewriteText
);

router.post(
  "/tools/translate",
  protect,
  auditAction({
    action: "AI_TEXT_TRANSLATED",
    resourceType: "ai-tool",
    description: "Used the AI text translator tool.",
    getMetadata: (req) => ({
      tool: "text-translator",
      sourceLanguage:
        req.body?.sourceLanguage || "auto",
      targetLanguage:
        req.body?.targetLanguage || "Hindi",
      tone: req.body?.tone || "natural",
      textLength:
        typeof req.body?.text === "string"
          ? req.body.text.length
          : 0,
    }),
  }),
  translateText
);

router.post(
  "/documents/analyze",
  protect,
  auditAction({
    action: "AI_DOCUMENT_ANALYZED",
    resourceType: "document",
    description:
      "Analyzed a document using AI Document Intelligence.",
    getResourceId: (req) =>
      req.body?.documentId || "",
    getMetadata: (req) => ({
      tool: "document-analyzer",
      documentId:
        req.body?.documentId || null,
    }),
  }),
  analyzeDocument
);

router.get(
  "/documents/analysis-history",
  protect,
  getAnalysisHistory
);

router.get(
  "/documents/analysis-history/:id",
  protect,
  getAnalysisHistoryById
);

router.delete(
  "/documents/analysis-history/:id",
  protect,
  auditAction({
    action: "AI_ANALYSIS_HISTORY_DELETED",
    resourceType: "ai-analysis-history",
    description: (req) =>
      `Deleted AI analysis history ${req.params.id}.`,
    getResourceId: (req) =>
      req.params.id,
    getMetadata: () => ({
      type: "single",
    }),
  }),
  deleteAnalysisHistory
);

router.post(
  "/chat",
  protect,
  aiRateLimiter,
  auditAction({
    action: "AI_REQUEST",
    resourceType: "ai-chat",
    description:
      "Sent a request to the AI workspace chat.",
    getResourceId: (req) =>
      req.body?.conversationId || "",
    getMetadata: (req) => ({
      type: "chat",
      messageCount:
        Array.isArray(req.body?.messages)
          ? req.body.messages.length
          : 0,
      hasConversation: Boolean(
        req.body?.conversationId
      ),
    }),
  }),
  chatWithAI
);

router.post(
  "/chat/stream",
  protect,
  aiRateLimiter,
  auditAction({
    action: "AI_REQUEST",
    resourceType: "ai-chat-stream",
    description:
      "Sent a streaming request to the AI workspace chat.",
    getResourceId: (req) =>
      req.body?.conversationId || "",
    getMetadata: (req) => ({
      type: "chat-stream",
      messageCount:
        Array.isArray(req.body?.messages)
          ? req.body.messages.length
          : 0,
      hasConversation: Boolean(
        req.body?.conversationId
      ),
    }),
  }),
  chatWithAIStream
);

router.post(
  "/chat/stream/regenerate",
  protect,
  aiRateLimiter,
  auditAction({
    action: "AI_REQUEST",
    resourceType: "ai-chat-regenerate",
    description:
      "Regenerated an AI workspace chat response.",
    getResourceId: (req) =>
      req.body?.conversationId || "",
    getMetadata: (req) => ({
      type: "chat-regenerate",
      messageId:
        req.body?.messageId || null,
      messageCount:
        Array.isArray(req.body?.messages)
          ? req.body.messages.length
          : 0,
      hasConversation: Boolean(
        req.body?.conversationId
      ),
    }),
  }),
  regenerateConversationMessageStream
);

router.get(
  "/history",
  protect,
  getMyGenerations
);

router.delete(
  "/history/:id",
  protect,
  auditAction({
    action: "AI_GENERATION_DELETED",
    resourceType: "ai-generation",
    description: (req) =>
      `Deleted AI generation ${req.params.id}.`,
    getResourceId: (req) =>
      req.params.id,
    getMetadata: () => ({
      type: "single",
    }),
  }),
  deleteGeneration
);

router.delete(
  "/history",
  protect,
  auditAction({
    action: "AI_GENERATION_HISTORY_CLEARED",
    resourceType: "ai-generation",
    description:
      "Cleared all AI generation history.",
    getMetadata: () => ({
      type: "all",
    }),
  }),
  deleteAllGenerations
);

export default router;
