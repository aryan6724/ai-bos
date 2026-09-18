import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const SUPPORTED_PROVIDERS = new Set(["gemini", "openai"]);
const MAX_PROMPT_LENGTH = 200000;
const MAX_PROVIDER_ERROR_LOG_LENGTH = 500;

const sanitizeErrorMessage = (value) => {
  const text = String(value || "AI provider request failed.")
    .replace(/(sk-[A-Za-z0-9_-]{20,})/g, "[REDACTED]")
    .replace(/(AIza[0-9A-Za-z_-]{20,})/g, "[REDACTED]")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, MAX_PROVIDER_ERROR_LOG_LENGTH);
};

const getProvider = () => {
  const provider = (process.env.AI_PROVIDER || "gemini")
    .trim()
    .toLowerCase();

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    const error = new Error("AI provider configuration is invalid.");
    error.statusCode = 500;
    throw error;
  }

  return provider;
};

const validatePrompt = (prompt) => {
  if (typeof prompt !== "string" || !prompt.trim()) {
    const error = new Error("AI prompt is required.");
    error.statusCode = 400;
    throw error;
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    const error = new Error("AI request is too large.");
    error.statusCode = 413;
    throw error;
  }

  return prompt;
};

const normalizeAIError = (error, provider, model) => {
  const status =
    Number(error?.status) ||
    Number(error?.statusCode) ||
    Number(error?.response?.status) ||
    500;

  const rawMessage =
    error?.message ||
    error?.response?.data?.error?.message ||
    "AI provider request failed.";

  const safeProviderMessage = sanitizeErrorMessage(rawMessage);

  console.error("AI provider request failed:", {
    provider,
    model,
    status,
    message: safeProviderMessage,
  });

  const normalizedError = new Error(
    status === 429
      ? "AI service is temporarily busy. Please try again later."
      : status === 401 || status === 403
        ? "AI service authentication failed."
        : status === 503
          ? "AI service is temporarily unavailable."
          : "AI service request failed."
  );

  normalizedError.statusCode =
    status >= 400 && status < 600 ? status : 500;

  normalizedError.provider = provider;
  normalizedError.model = model;

  return normalizedError;
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error("AI service is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return new GoogleGenAI({ apiKey });
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error("AI service is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return new OpenAI({ apiKey });
};

/* ======================================================
   NORMAL AI GENERATION
====================================================== */

export const generateAIContent = async (prompt) => {
  const cleanPrompt = validatePrompt(prompt);
  const provider = getProvider();

  try {
    if (provider === "openai") {
      const model = (
        process.env.OPENAI_MODEL || "gpt-5.6"
      ).trim();

      if (!model || model.length > 100) {
        const error = new Error("AI model configuration is invalid.");
        error.statusCode = 500;
        throw error;
      }

      const client = getOpenAIClient();

      const response = await client.responses.create({
        model,
        input: cleanPrompt,
      });

      const output = response?.output_text?.trim();

      if (!output) {
        const error = new Error("AI provider returned an empty response.");
        error.statusCode = 502;
        throw error;
      }

      return {
        output,
        provider,
        model,
      };
    }

    const model = (
      process.env.GEMINI_MODEL || "gemini-2.0-flash"
    ).trim();

    if (!model || model.length > 100) {
      const error = new Error("AI model configuration is invalid.");
      error.statusCode = 500;
      throw error;
    }

    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model,
      contents: cleanPrompt,
    });

    const output = response?.text?.trim();

    if (!output) {
      const error = new Error("AI provider returned an empty response.");
      error.statusCode = 502;
      throw error;
    }

    return {
      output,
      provider,
      model,
    };
  } catch (error) {
    if (
      error?.statusCode &&
      !error?.provider
    ) {
      throw error;
    }

    throw normalizeAIError(error, provider, 
      provider === "openai"
        ? (process.env.OPENAI_MODEL || "gpt-5.6").trim()
        : (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim()
    );
  }
};

/* ======================================================
   STREAMING AI GENERATION
====================================================== */

export const generateAIStream = async (prompt) => {
  const cleanPrompt = validatePrompt(prompt);
  const provider = getProvider();

  try {
    if (provider === "openai") {
      const model = (
        process.env.OPENAI_MODEL || "gpt-5.6"
      ).trim();

      if (!model || model.length > 100) {
        const error = new Error("AI model configuration is invalid.");
        error.statusCode = 500;
        throw error;
      }

      const client = getOpenAIClient();

      const stream = await client.responses.stream({
        model,
        input: cleanPrompt,
      });

      return {
        stream,
        provider,
        model,
      };
    }

    const model = (
      process.env.GEMINI_MODEL || "gemini-2.0-flash"
    ).trim();

    if (!model || model.length > 100) {
      const error = new Error("AI model configuration is invalid.");
      error.statusCode = 500;
      throw error;
    }

    const client = getGeminiClient();

    const stream = await client.models.generateContentStream({
      model,
      contents: cleanPrompt,
    });

    return {
      stream,
      provider,
      model,
    };
  } catch (error) {
    if (
      error?.statusCode &&
      !error?.provider
    ) {
      throw error;
    }

    throw normalizeAIError(
      error,
      provider,
      provider === "openai"
        ? (process.env.OPENAI_MODEL || "gpt-5.6").trim()
        : (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim()
    );
  }
};
