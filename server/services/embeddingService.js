import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Text is required for embedding generation");
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text.substring(0, 10000),
  });

  if (
    !response.embeddings ||
    !response.embeddings[0] ||
    !response.embeddings[0].values
  ) {
    throw new Error("Embedding generation failed");
  }

  return response.embeddings[0].values;
};