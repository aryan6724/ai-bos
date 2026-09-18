import rateLimit from "express-rate-limit";

// ======================================================
// GLOBAL API RATE LIMIT
// ======================================================

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 300,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Too many requests. Please try again later.",
    });
  },
});

// ======================================================
// AI / EXPENSIVE OPERATION LIMIT
// ======================================================

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 30,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many AI requests. Please try again later.",
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Too many AI requests. Please try again later.",
    });
  },
});

// ======================================================
// DOCUMENT UPLOAD LIMIT
// ======================================================

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 20,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many document uploads. Please try again later.",
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Too many document uploads. Please try again later.",
    });
  },
});

// ======================================================
// SEARCH LIMIT
// ======================================================

export const searchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 60,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many search requests. Please try again later.",
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Too many search requests. Please try again later.",
    });
  },
});

// ======================================================
// AUTHENTICATION LIMIT
// ======================================================

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Too many authentication attempts. Please try again later.",
    });
  },
});