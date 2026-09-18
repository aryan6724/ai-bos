import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { generateToken } from "../utils/generateToken.js";

/* ======================================================
   SAFE USER OBJECT
====================================================== */

const getSafeUser = (user) => {
  if (typeof user.toSafeObject === "function") {
    return user.toSafeObject();
  }

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    companyName: user.companyName,
    role: user.role,
    avatarInitial: user.avatarInitial,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
};

/* ======================================================
   VALIDATION HELPERS
====================================================== */

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

/* ======================================================
   AUTHENTICATION AUDIT HELPER
====================================================== */

const createAuthAuditLog = async ({
  req,
  user,
  action,
  description,
  statusCode,
  outcome,
  metadata = {},
  durationMs = 0,
}) => {
  try {
    if (!user?._id) {
      return;
    }

    await AuditLog.create({
      user: user._id,
      companyName:
        user.companyName || "AI-BOS Workspace",
      action,
      resourceType: "authentication",
      resourceId: String(user._id),
      description,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      outcome,
      ipAddress: req.ip || "",
      userAgent: req.get("user-agent") || "",
      durationMs,
      metadata,
    });
  } catch (error) {
    // Audit logging must never break authentication.
    console.error(
      "Authentication audit log creation failed:",
      error.message
    );
  }
};

/* ======================================================
   REGISTER USER
====================================================== */

export const registerUser = async (
  req,
  res,
  next
) => {
  const startedAt = Date.now();

  try {
    const {
      fullName,
      email,
      companyName,
      password,
    } = req.body || {};

    /* -----------------------------------------------
       BASIC INPUT VALIDATION
    ------------------------------------------------ */

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email and password are required.",
      });
    }

    const cleanedFullName = fullName.trim();
    const normalizedEmail = normalizeEmail(email);
    const cleanedCompanyName =
      typeof companyName === "string"
        ? companyName.trim()
        : "";

    /* -----------------------------------------------
       FULL NAME VALIDATION
    ------------------------------------------------ */

    if (!cleanedFullName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (cleanedFullName.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Full name must be 100 characters or less.",
      });
    }

    /* -----------------------------------------------
       EMAIL VALIDATION
    ------------------------------------------------ */

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    /* -----------------------------------------------
       PASSWORD VALIDATION
    ------------------------------------------------ */

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 128 characters or less.",
      });
    }

    /* -----------------------------------------------
       COMPANY NAME
    ------------------------------------------------ */

    const finalCompanyName =
      cleanedCompanyName || "AI-BOS Workspace";

    if (finalCompanyName.length > 150) {
      return res.status(400).json({
        success: false,
        message:
          "Company name must be 150 characters or less.",
      });
    }

    /* -----------------------------------------------
       CHECK EXISTING USER
    ------------------------------------------------ */

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User already exists with this email.",
      });
    }

    /* -----------------------------------------------
       CREATE USER
       
       IMPORTANT:
       Public registration must NOT create admins.
    ------------------------------------------------ */

    const user = await User.create({
      fullName: cleanedFullName,
      email: normalizedEmail,
      companyName: finalCompanyName,
      password,
      avatarInitial:
        cleanedFullName.charAt(0).toUpperCase(),

      // SECURITY:
      // Never trust role from client registration.
      role: "user",

      isActive: true,
    });

    /* -----------------------------------------------
       GENERATE TOKEN
    ------------------------------------------------ */

    const token = generateToken(user._id);

    /* -----------------------------------------------
       AUDIT LOG
    ------------------------------------------------ */

    await createAuthAuditLog({
      req,
      user,
      action: "AUTH_REGISTER",
      description:
        "Created a new AI-BOS account.",
      statusCode: 201,
      outcome: "success",
      metadata: {
        role: user.role,
      },
      durationMs: Date.now() - startedAt,
    });

    /* -----------------------------------------------
       RESPONSE
    ------------------------------------------------ */

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Register User Error:",
      error
    );

    next(error);
  }
};

/* ======================================================
   LOGIN USER
====================================================== */

export const loginUser = async (
  req,
  res,
  next
) => {
  const startedAt = Date.now();

  try {
    const {
      email,
      password,
    } = req.body || {};

    /* -----------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------ */

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    /* -----------------------------------------------
       FIND USER
    ------------------------------------------------ */

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    /*
      Keep the same generic error for invalid email
      and invalid password.
    */

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /* -----------------------------------------------
       ACCOUNT STATUS
    ------------------------------------------------ */

    if (user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact admin.",
      });
    }

    /* -----------------------------------------------
       PASSWORD CHECK
    ------------------------------------------------ */

    const isPasswordCorrect =
      await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /* -----------------------------------------------
       UPDATE LAST LOGIN
    ------------------------------------------------ */

    user.lastLogin = new Date();

    await user.save();

    /* -----------------------------------------------
       GENERATE TOKEN
    ------------------------------------------------ */

    const token = generateToken(user._id);

    /* -----------------------------------------------
       AUDIT LOG
    ------------------------------------------------ */

    await createAuthAuditLog({
      req,
      user,
      action: "AUTH_LOGIN",
      description:
        "User logged into AI-BOS successfully.",
      statusCode: 200,
      outcome: "success",
      metadata: {
        role: user.role,
      },
      durationMs: Date.now() - startedAt,
    });

    /* -----------------------------------------------
       RESPONSE
    ------------------------------------------------ */

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Login User Error:",
      error
    );

    next(error);
  }
};

/* ======================================================
   GET CURRENT USER
====================================================== */

export const getCurrentUser = async (
  req,
  res,
  next
) => {
  try {
    /* -----------------------------------------------
       AUTHENTICATION CHECK
    ------------------------------------------------ */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    /* -----------------------------------------------
       ACCOUNT STATUS CHECK
    ------------------------------------------------ */

    if (req.user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message:
          "Account is deactivated. Please contact admin.",
      });
    }

    /* -----------------------------------------------
       SAFE RESPONSE
    ------------------------------------------------ */

    return res.status(200).json({
      success: true,
      user: getSafeUser(req.user),
    });
  } catch (error) {
    console.error(
      "Get Current User Error:",
      error
    );

    next(error);
  }
};