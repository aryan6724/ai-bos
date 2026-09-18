import mongoose from "mongoose";
import { askKnowledgeBase } from "../services/ragService.js";

const MAX_QUESTION_LENGTH = 10_000;

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

export const askKnowledge = async (req, res, next) => {
  try {
    const { question, documentId } = req.body || {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const cleanQuestion = question.trim();

    if (cleanQuestion.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Question cannot exceed ${MAX_QUESTION_LENGTH} characters`,
      });
    }

    if (
      documentId !== undefined &&
      documentId !== null &&
      documentId !== "" &&
      !isValidObjectId(documentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const answer = documentId
      ? await askKnowledgeBase(
          cleanQuestion,
          req.user._id,
          documentId
        )
      : await askKnowledgeBase(
          cleanQuestion,
          req.user._id
        );

    return res.status(200).json({
      success: true,
      answer: answer?.output || "",
      provider: answer?.provider || null,
      model: answer?.model || null,
      sources: Array.isArray(answer?.sources)
        ? answer.sources.slice(0, 20)
        : [],
    });
  } catch (error) {
    next(error);
  }
};
