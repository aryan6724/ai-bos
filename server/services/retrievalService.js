import mongoose from "mongoose";
import DocumentChunk from "../models/DocumentChunk.js";
import { generateEmbedding } from "./embeddingService.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

const MIN_SIMILARITY_SCORE = 0.35;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

export const retrieveRelevantChunks = async (
  query,
  userId,
  documentId,
  limit = DEFAULT_LIMIT
) => {
  // ==========================================
  // 1. Validate Input
  // ==========================================

  if (
    !query ||
    typeof query !== "string" ||
    !query.trim()
  ) {
    return [];
  }

  if (!userId || !documentId) {
    throw new Error("User ID and Document ID are required.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID.");
  }

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new Error("Invalid document ID.");
  }

  // Prevent excessive retrieval
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  // ==========================================
  // 2. Generate Query Embedding
  // ==========================================

  const queryEmbedding = await generateEmbedding(
    query.trim()
  );

  if (
    !Array.isArray(queryEmbedding) ||
    queryEmbedding.length === 0
  ) {
    return [];
  }

  // ==========================================
  // 3. Retrieve ONLY User's Document Chunks
  // ==========================================

  const chunks = await DocumentChunk.find({
    user: userId,
    document: documentId,
  });

  // ==========================================
  // 4. Calculate Similarity
  // ==========================================

  const scored = [];

  for (const chunk of chunks) {
    if (
      !Array.isArray(chunk.embedding) ||
      chunk.embedding.length === 0
    ) {
      continue;
    }

    // Skip incompatible embeddings
    if (chunk.embedding.length !== queryEmbedding.length) {
      continue;
    }

    const score = cosineSimilarity(
      queryEmbedding,
      chunk.embedding
    );

    if (
      typeof score !== "number" ||
      !Number.isFinite(score)
    ) {
      continue;
    }

    if (score < MIN_SIMILARITY_SCORE) {
      continue;
    }

    scored.push({
      ...chunk.toObject(),
      score,
    });
  }

  // ==========================================
  // 5. Sort By Relevance
  // ==========================================

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    console.log(
      `RAG: No relevant chunks found for document ${documentId}`
    );

    return [];
  }

  // ==========================================
  // 6. Adaptive Relevance Threshold
  // ==========================================

  const topScore = scored[0].score;
  const adaptiveThreshold = topScore - 0.12;

  const relevantChunks = scored
    .filter(
      (chunk) => chunk.score >= adaptiveThreshold
    )
    .slice(0, safeLimit);

  // ==========================================
  // 7. Logging
  // ==========================================

  console.log(
    "RAG Retrieved Chunks:",
    relevantChunks.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      page: chunk.page,
      score: Number(chunk.score.toFixed(4)),
      preview:
        typeof chunk.content === "string"
          ? chunk.content.substring(0, 120)
          : "",
    }))
  );

  console.log(
    `RAG: ${relevantChunks.length} relevant chunks found for document ${documentId}`
  );

  return relevantChunks;
};