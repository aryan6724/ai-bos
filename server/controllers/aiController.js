import mongoose from "mongoose";
import Generation from "../models/Generation.js";
import {
  generateAIContent,
  generateAIStream,
} from "../utils/aiClient.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import createNotification from "../utils/createNotification.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import AnalysisHistory from "../models/AnalysisHistory.js";

// ======================================================
// Helpers
// ======================================================
const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// Security limits for AI inputs.
const MAX_CHAT_MESSAGES = 50;
const MAX_CHAT_MESSAGE_LENGTH = 10000;
const MAX_CHAT_TOTAL_LENGTH = 50000;
const MAX_GENERATION_INPUT_LENGTH = 50000;

const validateChatMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "Messages are required";
  }

  if (messages.length > MAX_CHAT_MESSAGES) {
    return `A maximum of ${MAX_CHAT_MESSAGES} messages is allowed`;
  }

  let totalLength = 0;

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return "Invalid message format";
    }

    if (!["user", "assistant"].includes(message.role)) {
      return "Invalid message role";
    }

    if (
      typeof message.content !== "string" ||
      !message.content.trim()
    ) {
      return "Each message must contain valid content";
    }

    const contentLength = message.content.trim().length;

    if (contentLength > MAX_CHAT_MESSAGE_LENGTH) {
      return `Each message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters`;
    }

    totalLength += contentLength;

    if (totalLength > MAX_CHAT_TOTAL_LENGTH) {
      return `Conversation content cannot exceed ${MAX_CHAT_TOTAL_LENGTH} characters`;
    }
  }

  return null;
};

const buildConversationPrompt = (messages) => {
  const intro = `
You are AI-BOS Enterprise Assistant.

You help users with:

- Business
- Programming
- Documents
- AI
- Productivity
- Technical Support

Always answer professionally using Markdown.

Conversation:
`;

  const history = messages
    .filter((msg) => msg?.content)
    .map((msg) => {
      return `${msg.role === "user" ? "User" : "Assistant"}:\n${msg.content}`;
    })
    .join("\n\n");

  return `${intro}\n${history}\n\nAssistant:`;
};

const FALLBACK_CONVERSATION_TITLE = "New Chat";
const MAX_CONVERSATION_TITLE_LENGTH = 60;

const cleanConversationTitle = (value) => {
  if (typeof value !== "string") return "";

  return value
    .replace(/[`*_#>\[\]{}]/g, "")
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")
    .replace(/[.!?;:,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONVERSATION_TITLE_LENGTH)
    .trim();
};

const buildFallbackConversationTitle = (message) => {
  const cleaned = cleanConversationTitle(message);

  if (!cleaned) return FALLBACK_CONVERSATION_TITLE;

  const words = cleaned.split(" ");
  const title = words.slice(0, 8).join(" ");

  return title.length > MAX_CONVERSATION_TITLE_LENGTH
    ? `${title.slice(0, MAX_CONVERSATION_TITLE_LENGTH - 3).trim()}...`
    : title;
};

const generateConversationTitle = async (userMessage) => {
  const source = typeof userMessage === "string"
    ? userMessage.trim().slice(0, 1000)
    : "";

  if (!source) return FALLBACK_CONVERSATION_TITLE;

  try {
    const titlePrompt = `
Create a concise title for the conversation based only on the user's message below.

Rules:
- Maximum 6 words.
- Prefer 2 to 6 words.
- Capture the main topic or intent.
- Do not invent details.
- Do not use quotes.
- Do not use emojis.
- Do not add punctuation.
- Return the title only.

User message:
${source}
`;

    const titleResponse = await generateAIContent(titlePrompt);
    const generatedTitle = cleanConversationTitle(titleResponse?.output);

    if (generatedTitle) return generatedTitle;
  } catch (error) {
    console.error("Conversation Title Generation Error:", error);
  }

  return buildFallbackConversationTitle(source);
};

const shouldAutoTitleConversation = (conversation) =>
  conversation &&
  ["New Chat", "New Conversation"].includes(conversation.title);

const DEFAULT_CONVERSATION_METADATA = {
  topic: "General Conversation",
  intent: "General assistance",
  category: "general",
  priority: "medium",
  keywords: [],
  confidence: 0,
};

const VALID_METADATA_CATEGORIES = new Set([
  "business",
  "programming",
  "documents",
  "ai",
  "productivity",
  "technical-support",
  "general",
]);

const VALID_METADATA_PRIORITIES = new Set([
  "low",
  "medium",
  "high",
]);

const cleanMetadataText = (value, maxLength) => {
  if (typeof value !== "string") return "";

  return value
    .replace(/[`*_#>\[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
};

const normalizeConversationMetadata = (value) => {
  const source = value && typeof value === "object" ? value : {};

  const topic = cleanMetadataText(source.topic, 80);
  const intent = cleanMetadataText(source.intent, 80);

  const category = VALID_METADATA_CATEGORIES.has(source.category)
    ? source.category
    : DEFAULT_CONVERSATION_METADATA.category;

  const priority = VALID_METADATA_PRIORITIES.has(source.priority)
    ? source.priority
    : DEFAULT_CONVERSATION_METADATA.priority;

  const keywords = Array.isArray(source.keywords)
    ? [...new Set(
        source.keywords
          .filter((keyword) => typeof keyword === "string")
          .map((keyword) => cleanMetadataText(keyword, 30))
          .filter(Boolean)
      )].slice(0, 8)
    : [];

  const rawConfidence = Number(source.confidence);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.min(1, Math.max(0, rawConfidence))
    : 0;

  return {
    topic: topic || DEFAULT_CONVERSATION_METADATA.topic,
    intent: intent || DEFAULT_CONVERSATION_METADATA.intent,
    category,
    priority,
    keywords,
    confidence: Number(confidence.toFixed(2)),
  };
};

const extractJsonObject = (value) => {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end <= start) return null;

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

const generateConversationMetadata = async (userMessage) => {
  const source = typeof userMessage === "string"
    ? userMessage.trim().slice(0, 1500)
    : "";

  if (!source) return DEFAULT_CONVERSATION_METADATA;

  try {
    const metadataPrompt = `
Analyze the user's message and classify the conversation.

Return ONLY valid JSON with exactly these fields:
{
  "topic": "short topic",
  "intent": "short user intent",
  "category": "business|programming|documents|ai|productivity|technical-support|general",
  "priority": "low|medium|high",
  "keywords": ["keyword1", "keyword2"],
  "confidence": 0.0
}

Rules:
- Use only information explicitly supported by the user's message.
- Do not invent names, facts, deadlines, or requirements.
- Topic should be 2 to 6 words.
- Intent should be a concise action or goal.
- Return at most 8 keywords.
- Confidence must be between 0 and 1.
- Do not include Markdown or code fences.

User message:
${source}
`;

    const response = await generateAIContent(metadataPrompt);
    const parsed = extractJsonObject(response?.output);

    return normalizeConversationMetadata(parsed);
  } catch (error) {
    console.error("Conversation Metadata Generation Error:", error);
    return DEFAULT_CONVERSATION_METADATA;
  }
};

const shouldGenerateConversationMetadata = (conversation) =>
  conversation &&
  !conversation.metadata?.generatedAt;

const getTitleByType = (type, input) => {
  if (type === "resume") {
    return `${input.targetRole || "Professional"} Resume`;
  }

  if (type === "email") {
    return `${input.purpose || "Business"} Email`;
  }

  if (type === "report") {
    return `${input.title || "Project"} Report`;
  }

  return "AI Generation";
};

// ======================================================
// AI Document Generator
// ======================================================
export const generateDocument = async (req, res, next) => {
  try {
    const { type, input } = req.body;

    if (!type || input === undefined || input === null) {
      return res.status(400).json({
        success: false,
        message: "Generation type and input are required",
      });
    }

    if (!["resume", "email", "report"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid generation type",
      });
    }

    if (
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return res.status(400).json({
        success: false,
        message: "Generation input must be a valid object",
      });
    }

    let serializedInput;
    try {
      serializedInput = JSON.stringify(input);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid generation input",
      });
    }

    if (
      typeof serializedInput !== "string" ||
      serializedInput.length > MAX_GENERATION_INPUT_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Generation input cannot exceed ${MAX_GENERATION_INPUT_LENGTH} characters`,
      });
    }

    const prompt = buildPrompt(type, input);
    const aiResult = await generateAIContent(prompt);

    if (!aiResult.output) {
      res.status(500);
      throw new Error("AI provider returned an empty response");
    }

    const generation = await Generation.create({
      user: req.user._id,
      type,
      title: getTitleByType(type, input),
      input,
      output: aiResult.output,
      provider: aiResult.provider,
      model: aiResult.model,
    });

    await createNotification({
      user: req.user,
      title: "AI Content Generated",
      message: `${generation.title} has been generated successfully.`,
      type: "success",
      category: "ai",
      actionUrl: "/dashboard/ai-generator",
      icon: "Sparkles",
    });

    return res.status(201).json({
      success: true,
      message: "Document generated successfully",
      generation,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Generation History
// ======================================================
export const getMyGenerations = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedPageSize = Number.parseInt(req.query.pageSize, 10) || 20;
    const pageSize = Math.min(Math.max(requestedPageSize, 1), 50);
    const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = { user: req.user._id };

    if (["resume", "email", "report"].includes(type)) {
      filter.type = type;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      filter.$or = [
        { title: searchRegex },
        { type: searchRegex },
        { output: searchRegex },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [generations, total] = await Promise.all([
      Generation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Generation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: generations.length,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
      generations,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Delete One Generation
// ======================================================
export const deleteGeneration = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Generation not found",
      });
    }

    const generation = await Generation.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!generation) {
      return res.status(404).json({
        success: false,
        message: "Generation not found",
      });
    }

    await Generation.deleteOne({
      _id: generation._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Generation deleted successfully",
      generationId: generation._id,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Delete All Generations
// ======================================================
export const deleteAllGenerations = async (req, res, next) => {
  try {
    const result = await Generation.deleteMany({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Generation history cleared successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// AI Text Improver
// ======================================================
export const improveText = async (req, res, next) => {
  try {
    const {
      text,
      mode = "improve",
      tone = "professional",
    } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const allowedModes = [
      "improve",
      "grammar",
      "professional",
      "friendly",
      "concise",
      "clear",
    ];

    const allowedTones = [
      "professional",
      "friendly",
      "formal",
      "simple",
      "business",
    ];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid improvement mode",
      });
    }

    if (!allowedTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tone",
      });
    }

    if (text.trim().length > 20000) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 20,000 characters",
      });
    }

    const modeInstructions = {
      improve:
        "Improve the writing while preserving the original meaning and important details.",
      grammar:
        "Correct grammar, spelling, punctuation, and sentence structure while preserving the original meaning.",
      professional:
        "Rewrite the text in a polished, professional, workplace-ready style without inventing facts.",
      friendly:
        "Rewrite the text in a warm, natural, friendly style without changing the intended meaning.",
      concise:
        "Make the text shorter and clearer while preserving the important information and intent.",
      clear:
        "Make the text easier to understand using clear, natural language while preserving the original meaning.",
    };

    const prompt = `
You are AI-BOS Text Improver, a professional writing assistant.

TASK:
${modeInstructions[mode]}

TONE:
${tone}

STRICT RULES:
- Preserve the user's original meaning.
- Do not invent facts, names, dates, numbers, achievements, qualifications, or claims.
- Do not remove important factual information unless the selected mode requires shortening.
- Return only the improved text.
- Do not add explanations, headings, quotation marks, or commentary.
- Keep the output natural and human-readable.

USER TEXT:
${text.trim()}
`;

    const aiResult = await generateAIContent(prompt);

    if (!aiResult?.output?.trim()) {
      return res.status(500).json({
        success: false,
        message: "AI provider returned an empty response",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Text improved successfully",
      result: {
        output: aiResult.output.trim(),
        mode,
        tone,
        provider: aiResult.provider,
        model: aiResult.model,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const summarizeText = async (req, res, next) => {
  try {
    const {
      text,
      mode = "quick",
      tone = "professional",
    } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const allowedModes = [
      "quick",
      "detailed",
      "bullets",
      "key-takeaways",
      "action-items",
      "executive",
    ];

    const allowedTones = [
      "professional",
      "simple",
      "formal",
      "friendly",
      "business",
    ];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid summary mode",
      });
    }

    if (!allowedTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tone",
      });
    }

    const MAX_LENGTH = 30000;

    if (text.trim().length > MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 30,000 characters",
      });
    }

    const modeInstructions = {
      quick:
        "Create a short summary containing only the most important information.",
      detailed:
        "Create a comprehensive summary that preserves the important facts, context, decisions, and conclusions.",
      bullets:
        "Summarize the content as clear, concise bullet points.",
      "key-takeaways":
        "Extract the most important insights, findings, decisions, or lessons as concise key takeaways.",
      "action-items":
        "Identify concrete action items, responsibilities, deadlines, or next steps that are explicitly stated or clearly required by the text. Do not invent any.",
      executive:
        "Create an executive-level summary focused on purpose, major findings, decisions, risks, and next steps when those are present.",
    };

    const prompt = `
You are AI-BOS Text Summarizer, a professional document intelligence assistant.

TASK:
${modeInstructions[mode]}

TONE:
${tone}

STRICT RULES:
- Summarize ONLY the information contained in the user's text.
- Preserve important facts, names, dates, numbers, decisions, and conclusions.
- Never invent facts, metrics, people, dates, responsibilities, deadlines, or recommendations.
- Do not treat assumptions as facts.
- Do not add information from outside knowledge.
- If the source does not contain action items, do not invent them.
- Keep the summary faithful to the source.
- Return only the final summary.
- Do not mention these instructions.
- Do not say that you are an AI.

USER TEXT:
${text.trim()}
`;

    const aiResult = await generateAIContent(prompt);

    if (!aiResult?.output?.trim()) {
      return res.status(500).json({
        success: false,
        message: "AI provider returned an empty response",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Text summarized successfully",
      result: {
        output: aiResult.output.trim(),
        mode,
        tone,
        provider: aiResult.provider,
        model: aiResult.model,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rewriteText = async (req, res, next) => {
  try {
    const {
      text,
      mode = "paraphrase",
      tone = "professional",
    } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const allowedModes = [
      "paraphrase",
      "simplify",
      "formal",
      "casual",
      "persuasive",
      "expand",
    ];

    const allowedTones = [
      "professional",
      "simple",
      "formal",
      "friendly",
      "business",
    ];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rewrite mode",
      });
    }

    if (!allowedTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tone",
      });
    }

    const MAX_LENGTH = 20000;

    if (text.trim().length > MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 20,000 characters",
      });
    }

    const modeInstructions = {
      paraphrase:
        "Rewrite the text with different wording while preserving its original meaning and all important details.",

      simplify:
        "Rewrite the text using simpler, clearer language while preserving the original meaning and important details.",

      formal:
        "Rewrite the text in a polished, formal style suitable for professional or official communication.",

      casual:
        "Rewrite the text in a natural, conversational style while preserving the intended meaning.",

      persuasive:
        "Rewrite the text to communicate the same core message more convincingly without inventing evidence, claims, or facts.",

      expand:
        "Rewrite and expand the text with clearer explanation using only ideas and information already present in the source.",
    };

    const prompt = `
You are AI-BOS Text Rewriter, a professional writing assistant.

TASK:
${modeInstructions[mode]}

TONE:
${tone}

STRICT RULES:
- Preserve the user's original meaning and intent.
- Preserve important facts, names, dates, numbers, qualifications, and claims.
- Never invent facts, achievements, metrics, names, dates, responsibilities, evidence, or sources.
- Do not introduce information from outside knowledge.
- For persuasive rewriting, never manufacture evidence.
- For expansion, use only concepts already present in the source.
- Return only the rewritten text.
- Do not add explanations or commentary.

USER TEXT:
${text.trim()}
`;

    const aiResult = await generateAIContent(prompt);

    if (!aiResult?.output?.trim()) {
      return res.status(500).json({
        success: false,
        message: "AI provider returned an empty response",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Text rewritten successfully",

      result: {
        output: aiResult.output.trim(),
        mode,
        tone,
        provider: aiResult.provider,
        model: aiResult.model,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const translateText = async (req, res, next) => {
  try {
    const {
      text,
      sourceLanguage = "auto",
      targetLanguage = "Hindi",
      tone = "natural",
    } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const allowedLanguages = [
      "English",
      "Hindi",
      "Spanish",
      "French",
      "German",
      "Portuguese",
      "Italian",
      "Japanese",
      "Chinese",
      "Korean",
      "Arabic",
      "Russian",
      "Bengali",
      "Tamil",
      "Telugu",
      "Marathi",
      "Gujarati",
      "Punjabi",
      "Urdu",
    ];

    const allowedTones = [
      "natural",
      "professional",
      "formal",
      "friendly",
      "simple",
    ];

    if (
      sourceLanguage !== "auto" &&
      !allowedLanguages.includes(sourceLanguage)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid source language",
      });
    }

    if (!allowedLanguages.includes(targetLanguage)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target language",
      });
    }

    if (!allowedTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid translation tone",
      });
    }

    const MAX_LENGTH = 20000;

    if (text.trim().length > MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 20,000 characters",
      });
    }

    const sourceInstruction =
      sourceLanguage === "auto"
        ? "Automatically detect the source language."
        : `The source language is ${sourceLanguage}.`;

    const prompt = `
You are AI-BOS Text Translator, a professional multilingual translation assistant.

TASK:
Translate the user's text into ${targetLanguage}.

SOURCE LANGUAGE:
${sourceInstruction}

TONE:
${tone}

STRICT RULES:
- Preserve the original meaning and intent.
- Preserve names, dates, numbers, technical terms, and important details.
- Do not add facts or information that are not present in the source.
- Do not remove important information.
- Do not summarize.
- Do not explain the translation.
- Keep formatting and paragraph structure where practical.
- Use natural ${targetLanguage} language.
- Maintain the requested tone.
- Return only the translated text.

USER TEXT:
${text.trim()}
`;

    const aiResult = await generateAIContent(prompt);

    if (!aiResult?.output?.trim()) {
      return res.status(500).json({
        success: false,
        message: "AI provider returned an empty translation",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Text translated successfully",
      result: {
        output: aiResult.output.trim(),
        sourceLanguage,
        targetLanguage,
        tone,
        provider: aiResult.provider,
        model: aiResult.model,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// AI Workspace Chat
// ======================================================
export const chatWithAI = async (req, res, next) => {
  try {
    const { conversationId, messages } = req.body;

    const chatValidationError = validateChatMessages(messages);

    if (chatValidationError) {
      return res.status(400).json({
        success: false,
        message: chatValidationError,
      });
    }

    let conversation;

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user._id,
        archived: false,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
      conversation = await Conversation.create({
        user: req.user._id,
        title: FALLBACK_CONVERSATION_TITLE,
      });
    }

    const latestUserMessage = messages[messages.length - 1];

    if (
      !latestUserMessage ||
      latestUserMessage.role !== "user" ||
      typeof latestUserMessage.content !== "string" ||
      !latestUserMessage.content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid user message is required",
      });
    }

    const userMessage = latestUserMessage.content.trim();

    await Message.create({
      conversation: conversation._id,
      role: "user",
      content: userMessage,
    });

    const prompt = buildConversationPrompt(messages);
    const aiResult = await generateAIContent(prompt);

    if (!aiResult?.output?.trim()) {
      return res.status(500).json({
        success: false,
        message: "AI provider returned an empty response",
      });
    }

    const assistantResponse = aiResult.output.trim();

    await Message.create({
      conversation: conversation._id,
      role: "assistant",
      content: assistantResponse,
    });

    conversation.lastMessage = assistantResponse;

    if (shouldAutoTitleConversation(conversation)) {
      conversation.title = await generateConversationTitle(userMessage);
    }

    if (shouldGenerateConversationMetadata(conversation)) {
      conversation.metadata = {
        ...(await generateConversationMetadata(userMessage)),
        generatedAt: new Date(),
      };
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      response: assistantResponse,
      provider: aiResult.provider,
      model: aiResult.model,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// AI Workspace Streaming Chat
// ======================================================
export const chatWithAIStream = async (req, res, next) => {
  try {
    const { conversationId, messages } = req.body;

    const chatValidationError = validateChatMessages(messages);

    if (chatValidationError) {
      return res.status(400).json({
        success: false,
        message: chatValidationError,
      });
    }

    let conversation;

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user._id,
        archived: false,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
      conversation = await Conversation.create({
        user: req.user._id,
        title: FALLBACK_CONVERSATION_TITLE,
      });
    }

    const latestUserMessage = messages[messages.length - 1];

    if (
      !latestUserMessage ||
      latestUserMessage.role !== "user" ||
      typeof latestUserMessage.content !== "string" ||
      !latestUserMessage.content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid user message is required",
      });
    }

    const userMessage = latestUserMessage.content.trim();

    await Message.create({
      conversation: conversation._id,
      role: "user",
      content: userMessage,
    });

    const prompt = buildConversationPrompt(messages);
    const { stream } = await generateAIStream(prompt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders?.();

    res.write(
      `event: conversation\n` +
        `data: ${JSON.stringify({
          conversationId: conversation._id,
        })}\n\n`
    );

    let fullResponse = "";

    for await (const chunk of stream) {
      const text =
        typeof chunk.text === "function"
          ? chunk.text()
          : chunk.text;

      if (!text) continue;

      fullResponse += text;

      res.write(
        `event: chunk\n` +
          `data: ${text}\n\n`
      );
    }

    if (fullResponse.trim()) {
      const assistantResponse = fullResponse.trim();

      await Message.create({
        conversation: conversation._id,
        role: "assistant",
        content: assistantResponse,
      });

      conversation.lastMessage = assistantResponse;

      if (shouldAutoTitleConversation(conversation)) {
        conversation.title = await generateConversationTitle(
          userMessage
        );
      }

      if (shouldGenerateConversationMetadata(conversation)) {
        conversation.metadata = {
          ...await generateConversationMetadata(userMessage),
          generatedAt: new Date(),
        };
      }

      await conversation.save();
    }

    res.write(
      `event: done\n` +
        `data: END\n\n`
    );

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      console.error(error);
      res.end();
    }
  }
};


// ======================================================
// AI Workspace Streaming Chat Regeneration
// ======================================================
export const regenerateConversationMessageStream = async (
  req,
  res,
  next
) => {
  try {
    const {
      conversationId,
      messageId,
      messages,
    } = req.body || {};

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required",
      });
    }

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const chatValidationError = validateChatMessages(messages);

    if (chatValidationError) {
      return res.status(400).json({
        success: false,
        message: `Conversation context: ${chatValidationError}`,
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const targetMessage = await Message.findOne({
      _id: messageId,
      conversation: conversation._id,
      role: "assistant",
    });

    if (!targetMessage) {
      return res.status(404).json({
        success: false,
        message: "Assistant message not found",
      });
    }

    const contextMessages = messages.map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

    if (contextMessages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid conversation context is required",
      });
    }

    const latestContextMessage =
      contextMessages[contextMessages.length - 1];

    if (latestContextMessage.role !== "user") {
      return res.status(400).json({
        success: false,
        message:
          "Regeneration requires the previous user message as the latest context message",
      });
    }

    const prompt = buildConversationPrompt(
      contextMessages
    );

    const { stream } = await generateAIStream(prompt);

    res.setHeader(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders?.();

    res.write(
      `event: conversation\n` +
        `data: ${JSON.stringify({
          conversationId: conversation._id,
          messageId: targetMessage._id,
        })}\n\n`
    );

    let fullResponse = "";

    for await (const chunk of stream) {
      const text =
        typeof chunk.text === "function"
          ? chunk.text()
          : chunk.text;

      if (!text) continue;

      fullResponse += text;

      res.write(
        `event: chunk\n` +
          `data: ${text}\n\n`
      );
    }

    if (!fullResponse.trim()) {
      res.write(
        `event: error\n` +
          `data: ${JSON.stringify({
            message:
              "AI provider returned an empty response",
          })}\n\n`
      );

      res.end();
      return;
    }

    targetMessage.content = fullResponse;
    await targetMessage.save();

    conversation.lastMessage = fullResponse;
    await conversation.save();

    res.write(
      `event: done\n` +
        `data: ${JSON.stringify({
          conversationId: conversation._id,
          messageId: targetMessage._id,
        })}\n\n`
    );

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      console.error(
        "Regenerate AI stream error:",
        error
      );

      try {
        res.write(
          `event: error\n` +
            `data: ${JSON.stringify({
              message:
                error?.message ||
                "Failed to regenerate AI response.",
            })}\n\n`
        );
      } catch {}

      res.end();
    }
  }
};

export const analyzeDocument = async (req, res, next) => {
  try {
    const {
      documentId,
      forceReanalyze = false,
    } = req.body || {};

    /* ===========================
       Validate Document ID
    =========================== */

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    if (!isValidObjectId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    /* ===========================
       Find User's Document
    =========================== */

    const document = await Document.findOne({
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

    /* ===========================
       Return Saved Analysis
       Unless Re-analysis Requested
    =========================== */

    if (
      !forceReanalyze &&
      document.aiAnalysis?.output?.trim()
    ) {
      return res.status(200).json({
        success: true,
        message: "Saved document analysis loaded",
        cached: true,

        result: {
          documentId: document._id,
          documentName: document.originalName,
          documentType: document.documentType,

          output: document.aiAnalysis.output,

          sections: {
            summary:
              document.aiAnalysis.sections?.summary || "",

            keyPoints:
              document.aiAnalysis.sections?.keyPoints || "",

            keyInformation:
              document.aiAnalysis.sections?.keyInformation || "",

            importantDates:
              document.aiAnalysis.sections?.importantDates || "",

            importantNumbers:
              document.aiAnalysis.sections?.importantNumbers || "",

            risksAndIssues:
              document.aiAnalysis.sections?.risksAndIssues || "",

            actionItems:
              document.aiAnalysis.sections?.actionItems || "",

            keywords:
              Array.isArray(
                document.aiAnalysis.sections?.keywords
              )
                ? document.aiAnalysis.sections.keywords
                : [],
          },

          provider:
            document.aiAnalysis.provider || "",

          model:
            document.aiAnalysis.model || "",

          analyzedAt:
            document.aiAnalysis.analyzedAt || null,
        },
      });
    }

    /* ===========================
       Validate Extracted Text
    =========================== */

    if (!document.text?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "This document does not contain extracted text yet",
      });
    }

    /* ===========================
       Limit AI Input
    =========================== */

    const MAX_LENGTH = 50000;

    const documentText = document.text
      .trim()
      .slice(0, MAX_LENGTH);

    /* ===========================
       AI Analysis Prompt
    =========================== */

    const prompt = `
You are AI-BOS Document Intelligence, a professional document analysis assistant.

Analyze the document provided below.

DOCUMENT NAME:
${document.originalName}

DOCUMENT TYPE:
${document.documentType || "General"}

TASK:

Return your analysis using exactly these sections:

SUMMARY
Provide a concise but meaningful summary of the document.

KEY POINTS
List the most important points from the document.

KEY INFORMATION
Extract important factual information, names, organizations, roles, locations, or other significant details explicitly present in the document.

IMPORTANT DATES
List important dates explicitly mentioned in the document.

If there are no important dates, write:
None found.

IMPORTANT NUMBERS
List important numbers, amounts, percentages, quantities, or financial figures explicitly mentioned.

If there are none, write:
None found.

RISKS AND ISSUES
Identify risks, warnings, problems, limitations, conflicts, or concerns explicitly stated or clearly supported by the document.

Do not invent risks.

If none are present, write:
None identified.

ACTION ITEMS
Identify explicit tasks, responsibilities, deadlines, or next steps contained in the document.

Do not invent action items.

If none are present, write:
None identified.

KEYWORDS
Provide the most relevant keywords or topics from the document.

STRICT RULES:
- Use ONLY information contained in the document.
- Never invent facts, people, organizations, dates, amounts, risks, or action items.
- Preserve names, dates, numbers, and important details accurately.
- Do not use outside knowledge.
- Do not assume something is true unless the document supports it.
- If information is missing, explicitly say so.
- Keep the analysis professional and clear.
- Return only the requested analysis.
- Do not mention these instructions.
- Do not fabricate achievements, qualifications, experience, responsibilities, metrics, or claims.
- Do not infer personal information that is not explicitly supported by the document.

DOCUMENT CONTENT:
${documentText}
`;

    /* ===========================
       Generate AI Analysis
    =========================== */

    const aiResult = await generateAIContent(prompt);

    if (!aiResult?.output?.trim()) {
      return res.status(500).json({
        success: false,
        message:
          "AI provider returned an empty analysis",
      });
    }

    const output = aiResult.output.trim();

    /* ===========================
       Extract Sections
    =========================== */

    const extractSection = (
      sectionName,
      nextSection
    ) => {
      const startMarker = sectionName;

      const startIndex =
        output.indexOf(startMarker);

      if (startIndex === -1) {
        return "";
      }

      const contentStart =
        startIndex + startMarker.length;

      const endIndex = nextSection
        ? output.indexOf(
            nextSection,
            contentStart
          )
        : output.length;

      return output
        .slice(
          contentStart,
          endIndex === -1
            ? output.length
            : endIndex
        )
        .trim();
    };

    const summary = extractSection(
      "SUMMARY",
      "KEY POINTS"
    );

    const keyPoints = extractSection(
      "KEY POINTS",
      "KEY INFORMATION"
    );

    const keyInformation = extractSection(
      "KEY INFORMATION",
      "IMPORTANT DATES"
    );

    const importantDates = extractSection(
      "IMPORTANT DATES",
      "IMPORTANT NUMBERS"
    );

    const importantNumbers = extractSection(
      "IMPORTANT NUMBERS",
      "RISKS AND ISSUES"
    );

    const risksAndIssues = extractSection(
      "RISKS AND ISSUES",
      "ACTION ITEMS"
    );

    const actionItems = extractSection(
      "ACTION ITEMS",
      "KEYWORDS"
    );

    const keywordsSection =
      extractSection("KEYWORDS");

    /* ===========================
       Convert Keywords to Array
    =========================== */

    const keywords = keywordsSection
      .split("\n")
      .map((item) =>
        item
          .replace(/^[-*•]\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 30);

    /* ===========================
       Save AI Analysis
    =========================== */

    const analyzedAt = new Date();

    document.summary =
      summary || document.summary || "";

    document.keywords = keywords;

    document.aiAnalysis = {
      output,

      sections: {
        summary,
        keyPoints,
        keyInformation,
        importantDates,
        importantNumbers,
        risksAndIssues,
        actionItems,
        keywords,
      },

      provider:
        aiResult.provider || "",

      model:
        aiResult.model || "",

      analyzedAt,
    };

    document.processedAt = analyzedAt;

    await document.save();

const historyRecord = await AnalysisHistory.create({
  user: req.user._id,
  document: document._id,

  documentName:
    document.originalName || "Untitled Document",

  documentType:
    document.documentType || "General",

  output,

  sections: {
    summary,
    keyPoints,
    keyInformation,
    importantDates,
    importantNumbers,
    risksAndIssues,
    actionItems,
    keywords,
  },

  provider: aiResult.provider || "",

  model: aiResult.model || "",

  analyzedAt,
});

    /* ===========================
       Return Fresh Analysis
    =========================== */

    return res.status(200).json({
      success: true,
      message: "Document analyzed successfully",
      cached: false,

      result: {
        documentId: document._id,

        documentName:
          document.originalName,

        documentType:
          document.documentType,

        output,

        sections: {
          summary,
          keyPoints,
          keyInformation,
          importantDates,
          importantNumbers,
          risksAndIssues,
          actionItems,
          keywords,
        },

        provider:
          aiResult.provider || "",

        model:
          aiResult.model || "",

        analyzedAt,

        processedAt:
          document.processedAt,

          historyId: historyRecord._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Analysis History
// ======================================================

export const getAnalysisHistory = async (
  req,
  res,
  next
) => {
  try {
    const {
      documentId,
      page = 1,
      pageSize = 10,
    } = req.query;

    const currentPage =
      Math.max(Number(page) || 1, 1);

    const limit =
      Math.min(
        Math.max(Number(pageSize) || 10, 1),
        50
      );

    const filter = {
      user: req.user._id,
    };

    if (
      documentId &&
      mongoose.Types.ObjectId.isValid(
        documentId
      )
    ) {
      filter.document = documentId;
    }

    const skip =
      (currentPage - 1) * limit;

    const [
      history,
      total,
    ] = await Promise.all([
      AnalysisHistory.find(filter)
        .select(
          "document documentName documentType provider model analyzedAt createdAt"
        )
        .sort({
          analyzedAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AnalysisHistory.countDocuments(
        filter
      ),
    ]);

    return res.status(200).json({
      success: true,

      history,

      pagination: {
        page: currentPage,

        pageSize: limit,

        total,

        totalPages:
          Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// Get Single Analysis History
// ======================================================

export const getAnalysisHistoryById =
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid analysis history ID",
        });
      }

      const history =
        await AnalysisHistory.findOne({
          _id: id,
          user: req.user._id,
        }).lean();

      if (!history) {
        return res.status(404).json({
          success: false,
          message:
            "Analysis history not found",
        });
      }

      return res.status(200).json({
        success: true,

        result: {
          documentId:
            history.document,

          documentName:
            history.documentName,

          documentType:
            history.documentType,

          output:
            history.output,

          sections:
            history.sections,

          provider:
            history.provider,

          model:
            history.model,

          analyzedAt:
            history.analyzedAt,

          cached: true,

          historyId:
            history._id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// Delete Single Analysis History
// ======================================================

export const deleteAnalysisHistory =
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid analysis history ID",
        });
      }

      const deleted =
        await AnalysisHistory.findOneAndDelete({
          _id: id,
          user: req.user._id,
        });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message:
            "Analysis history not found",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Analysis history deleted successfully",

        historyId: id,
      });
    } catch (error) {
      next(error);
    }
  };
