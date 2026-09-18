import { generateAIContent } from "./aiClient.js";

export const analyzeDocument = async (document) => {
  try {
    console.log("========================================");
    console.log("Starting AI Document Analysis...");
    console.log("Document:", document.originalName);
    console.log("========================================");

    const prompt = `
You are an AI document analysis engine.

Analyze the document below.

Return ONLY valid JSON.

{
  "summary": "",
  "keywords": [],
  "documentType": "",
  "language": "",
  "entities": {
    "people": [],
    "organizations": [],
    "dates": [],
    "amounts": []
  }
}

Document:

${document.text.slice(0, 25000)}
`;

    const ai = await generateAIContent(prompt);

    console.log("AI Document Analysis Response Received.");

    let rawOutput = "";

    if (typeof ai === "string") {
      rawOutput = ai;
    } else if (ai?.output) {
      rawOutput = ai.output;
    } else if (ai?.text) {
      rawOutput = ai.text;
    }

    console.log("Raw Analysis Output:", rawOutput);

    try {
      const cleanedOutput = rawOutput
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedOutput);

      console.log("AI Document Analysis Completed Successfully.");
      console.log("========================================");

      return parsed;
    } catch (parseError) {
      console.error(
        "AI Analysis JSON Parse Error:",
        parseError.message
      );

      return {
        summary: "",
        keywords: [],
        documentType: "General",
        language: "en",
        entities: {
          people: [],
          organizations: [],
          dates: [],
          amounts: [],
        },
      };
    }
  } catch (error) {
    console.error("AI Document Analysis Error:", error);
    throw error;
  }
};