import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // ==========================================
    // 1. CHECK AUTHORIZATION HEADER
    // ==========================================
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token || token.length > 4096) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // ==========================================
    // 2. CHECK JWT SECRET
    // ==========================================
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables.");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    // ==========================================
    // 3. VERIFY JWT
    // ==========================================
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // ==========================================
    // 4. VALIDATE TOKEN PAYLOAD
    // ==========================================
    const userId = decoded?.userId;

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // ==========================================
    // 5. LOAD USER + PASSWORD RESET VERSION
    // ==========================================
    const user = await User.findById(userId)
      .select("_id fullName email role isActive companyName avatarInitial lastLogin createdAt +passwordChangedAt")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // ==========================================
    // 6. INVALIDATE JWTs ISSUED BEFORE PASSWORD CHANGE
    // ==========================================
    if (user.passwordChangedAt) {
      const issuedAtMs = Number(decoded.iat || 0) * 1000;
      const passwordChangedAtMs =
        new Date(user.passwordChangedAt).getTime();

      if (
        !Number.isFinite(issuedAtMs) ||
        !Number.isFinite(passwordChangedAtMs) ||
        issuedAtMs < passwordChangedAtMs
      ) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Session expired.",
        });
      }
    }

    // ==========================================
    // 7. CHECK ACCOUNT STATUS
    // ==========================================
    if (user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // ==========================================
    // 8. ATTACH AUTHENTICATED USER
    // ==========================================
    // passwordChangedAt is intentionally removed from req.user.
    delete user.passwordChangedAt;

    req.user = user;

    next();
  } catch (error) {
    // Log only the error type/name, not the raw error object.
    console.error(
      "Authentication error:",
      error?.name || "UnknownError"
    );

    // ==========================================
    // 9. JWT ERROR HANDLING
    // ==========================================
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token failed.",
      });
    }

    if (error.name === "CastError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized.",
    });
  }
};

// ==========================================
// ROLE AUTHORIZATION MIDDLEWARE
// ==========================================

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized.",
        });
      }

      if (
        !roles.length ||
        roles.some(
          (role) =>
            typeof role !== "string" ||
            !["admin", "manager", "user"].includes(role)
        )
      ) {
        return res.status(500).json({
          success: false,
          message: "Authorization configuration error.",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not have permission.",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
