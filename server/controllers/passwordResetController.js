import crypto from "node:crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const genericResponse = {
  success: true,
  message:
    "If an account exists for this email, password reset instructions have been sent.",
};

const invalidResetResponse = {
  success: false,
  message: "Invalid or expired password reset link.",
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email || email.length > MAX_EMAIL_LENGTH) {
      return res.status(200).json(genericResponse);
    }

    const user = await User.findOne({
      email,
      isActive: true,
    }).select(
      "_id email fullName +passwordResetTokenHash +passwordResetExpires"
    );

    // Always return the same response to prevent account enumeration.
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.fullName,
        token: rawToken,
      });
    } catch (emailError) {
      // Do not leave a usable reset token behind if delivery fails.
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Avoid logging SMTP/provider error details because they may contain
      // infrastructure or recipient information.
      console.error(
        "Password reset email delivery failed:",
        emailError?.name || "EmailServiceError"
      );
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token =
      typeof req.body?.token === "string" ? req.body.token.trim() : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (
      !token ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      password.length < MIN_PASSWORD_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json(invalidResetResponse);
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    }).select(
      "+passwordResetTokenHash +passwordResetExpires +password +passwordChangedAt"
    );

    if (!user) {
      return res.status(400).json(invalidResetResponse);
    }

    // User model's pre-save hook hashes the new password.
    user.password = password;

    // One-time use: clear the reset credentials before saving.
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;

    // authMiddleware rejects JWTs issued before this password change.
    user.passwordChangedAt = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};
