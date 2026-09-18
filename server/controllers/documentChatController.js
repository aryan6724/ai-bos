import mongoose from "mongoose";

import Document from "../models/Document.js";
import DocumentChat from "../models/DocumentChat.js";
import { askKnowledgeBase } from "../services/ragService.js";

// ======================================================
// OBJECT ID VALIDATION
// ======================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// ASK DOCUMENT QUESTION
// ======================================================

export const askDocumentQuestion = async (
  req,
  res,
  next
) => {
  try {
    const { documentId } = req.params;
    const { question } = req.body;

    // ------------------------------------------
    // Validate Document ID
    // ------------------------------------------

    if (!isValidObjectId(documentId)) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Validate Question
    // ------------------------------------------

    if (
  !question ||
  typeof question !== "string" ||
  !question.trim()
) {
  return res.status(400).json({
    success: false,
    message: "Question is required",
  });
}

if (question.length > 10000) {
  return res.status(400).json({
    success: false,
    message: "Question cannot exceed 10,000 characters",
  });
}

    if (question.length > 10000) {
  return res.status(400).json({
    success: false,
    message: "Question cannot exceed 10,000 characters",
  });
}

    // ------------------------------------------
    // Verify Document Ownership
    // ------------------------------------------

    const document =
      await Document.findOne({
        _id: documentId,
        user: req.user._id,
        isDeleted: false,
      });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Ask Knowledge Base
    // ------------------------------------------

    const aiResult =
      await askKnowledgeBase(
        question.trim(),
        req.user._id,
        document._id
      );

    // ------------------------------------------
    // Validate AI Response
    // ------------------------------------------

    if (!aiResult?.output) {
      res.status(500);
      throw new Error(
        "AI provider returned an empty response"
      );
    }

    // ------------------------------------------
    // Save Chat
    // ------------------------------------------

    const chat =
      await DocumentChat.create({
        user: req.user._id,
        document: document._id,
        question: question.trim(),
        answer: aiResult.output,

        provider:
          aiResult.provider || "gemini",

        model:
          aiResult.model || "document-rag",

        sources:
          aiResult.sources || [],

        feedback: null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Document question answered successfully",
      chat,
      rag: {
        grounded: Array.isArray(chat.sources) &&
          chat.sources.length > 0,
        sourceCount: Array.isArray(chat.sources)
          ? chat.sources.length
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET DOCUMENT CHAT HISTORY
// ======================================================

export const getDocumentChatHistory = async (
  req,
  res,
  next
) => {
  try {
    const { documentId } = req.params;

    // ------------------------------------------
    // Validate Document ID
    // ------------------------------------------

    if (!isValidObjectId(documentId)) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Verify Document Ownership
    // ------------------------------------------

    const document =
      await Document.findOne({
        _id: documentId,
        user: req.user._id,
        isDeleted: false,
      }).select(
        "_id originalName fileName mimeType size category status pages wordCount language summary keywords documentType createdAt updatedAt"
      );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Get Only This User's Chats
    // ------------------------------------------

    const chats =
      await DocumentChat.find({
        user: req.user._id,
        document: documentId,
      }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: chats.length,
      document,
      chats,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// CLEAR DOCUMENT CHAT HISTORY
// ======================================================

export const clearDocumentChatHistory = async (
  req,
  res,
  next
) => {
  try {
    const { documentId } = req.params;

    // ------------------------------------------
    // Validate Document ID
    // ------------------------------------------

    if (!isValidObjectId(documentId)) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Verify Document Ownership
    // ------------------------------------------

    const document =
      await Document.findOne({
        _id: documentId,
        user: req.user._id,
        isDeleted: false,
      });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Delete Only This User's Chats
    // ------------------------------------------

    await DocumentChat.deleteMany({
      user: req.user._id,
      document: documentId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Document chat history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// UPDATE DOCUMENT CHAT FEEDBACK
// ======================================================

export const updateDocumentChatFeedback = async (
  req,
  res,
  next
) => {
  try {
    const { chatId } = req.params;
    const { feedback } = req.body;

    // ------------------------------------------
    // Validate Chat ID
    // ------------------------------------------

    if (!isValidObjectId(chatId)) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // ------------------------------------------
    // Validate Feedback
    // ------------------------------------------

    if (
      feedback !== null &&
      feedback !== "like" &&
      feedback !== "dislike"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback value",
      });
    }

    // ------------------------------------------
    // Find Chat Owned By Current User
    // ------------------------------------------

    const chat =
      await DocumentChat.findOne({
        _id: chatId,
        user: req.user._id,
      });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // ------------------------------------------
    // Verify Parent Document
    // ------------------------------------------

    const document =
      await Document.findOne({
        _id: chat.document,
        user: req.user._id,
        isDeleted: false,
      }).select("_id");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Update Feedback
    // ------------------------------------------

    chat.feedback = feedback;

    await chat.save();

    return res.status(200).json({
      success: true,
      message:
        "Feedback updated successfully",
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// REGENERATE DOCUMENT CHAT
// ======================================================

export const regenerateDocumentChat = async (
  req,
  res,
  next
) => {
  try {
    const { chatId } = req.params;

    // ------------------------------------------
    // Validate Chat ID
    // ------------------------------------------

    if (!isValidObjectId(chatId)) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // ------------------------------------------
    // Find Chat Owned By Current User
    // ------------------------------------------

    const existingChat =
      await DocumentChat.findOne({
        _id: chatId,
        user: req.user._id,
      });

    if (!existingChat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // ------------------------------------------
    // Verify Parent Document Ownership
    // ------------------------------------------

    const document =
      await Document.findOne({
        _id: existingChat.document,
        user: req.user._id,
        isDeleted: false,
      });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ------------------------------------------
    // Regenerate Answer
    // ------------------------------------------

    const aiResult =
      await askKnowledgeBase(
        existingChat.question,
        req.user._id,
        document._id
      );

    // ------------------------------------------
    // Validate AI Response
    // ------------------------------------------

    if (!aiResult?.output) {
      res.status(500);
      throw new Error(
        "AI provider returned an empty response"
      );
    }

    // ------------------------------------------
    // Update Chat
    // ------------------------------------------

    existingChat.answer =
      aiResult.output;

    existingChat.provider =
      aiResult.provider ||
      existingChat.provider ||
      "gemini";

    existingChat.model =
      aiResult.model ||
      existingChat.model ||
      "document-rag";

    existingChat.sources =
      aiResult.sources || [];

    // Regeneration resets previous feedback
    existingChat.feedback = null;

    await existingChat.save();

    return res.status(200).json({
      success: true,
      message:
        "Document answer regenerated successfully",
      chat: existingChat,
      rag: {
        grounded: Array.isArray(existingChat.sources) &&
          existingChat.sources.length > 0,
        sourceCount: Array.isArray(existingChat.sources)
          ? existingChat.sources.length
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};