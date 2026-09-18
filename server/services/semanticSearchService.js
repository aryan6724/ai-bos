import Document from "../models/Document.js";
import { generateEmbedding } from "./embeddingService.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

export const semanticSearch = async (query, userId) => {
  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(query);

  // Fetch all searchable documents
  const documents = await Document.find({
    user: userId,
    isIndexed: true,
    isDeleted: false,
  });

  const results = [];

  for (const document of documents) {
    // Skip documents without embeddings
    if (
      !document.embedding ||
      !Array.isArray(document.embedding) ||
      document.embedding.length === 0
    ) {
      continue;
    }

    const score = cosineSimilarity(
      queryEmbedding,
      document.embedding
    );

    results.push({
      ...document.toObject(),
      score,
    });
  }

  // Highest similarity first
  results.sort((a, b) => b.score - a.score);

  // Return top 10 matches
  return results.slice(0, 10);
};