import express from "express";

import {
  createConversation,
  getConversations,
  getArchivedConversations,
  getConversationMessages,
  getConversationAnalytics,
  getConversationStats,
  renameConversation,
  deleteConversation,
  togglePinConversation,
  archiveConversation,
  unarchiveConversation,
} from "../controllers/conversationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createConversation);

router.get("/", protect, getConversations);

// Archived conversations
// Keep this before /:id
router.get("/archived", protect, getArchivedConversations);

// Conversation stats
router.get("/:id/stats", protect, getConversationStats);

// Analytics
router.get("/analytics", protect, getConversationAnalytics);

// Get conversation messages
router.get("/:id", protect, getConversationMessages);

// Rename conversation
router.patch("/:id", protect, renameConversation);

// Pin / Unpin conversation
router.patch("/:id/pin", protect, togglePinConversation);

// Archive conversation
router.patch("/:id/archive", protect, archiveConversation);

// Unarchive conversation
router.patch("/:id/unarchive", protect, unarchiveConversation);

// Delete conversation
router.delete("/:id", protect, deleteConversation);

export default router;