import bcrypt from "bcryptjs";
import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

const MAX_NAME_LENGTH = 80;
const MAX_COMPANY_LENGTH = 150;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, companyName, avatarInitial } = req.body || {};

    if (
      fullName !== undefined &&
      (typeof fullName !== "string" ||
        fullName.trim().length < 2 ||
        fullName.trim().length > MAX_NAME_LENGTH)
    ) {
      return sendError(
        res,
        400,
        `Full name must be between 2 and ${MAX_NAME_LENGTH} characters`
      );
    }

    if (
      companyName !== undefined &&
      (typeof companyName !== "string" ||
        companyName.trim().length > MAX_COMPANY_LENGTH)
    ) {
      return sendError(
        res,
        400,
        `Company name cannot exceed ${MAX_COMPANY_LENGTH} characters`
      );
    }

    if (
      avatarInitial !== undefined &&
      (typeof avatarInitial !== "string" ||
        avatarInitial.trim().length === 0)
    ) {
      return sendError(res, 400, "Invalid avatar initial");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (fullName !== undefined) {
      user.fullName = fullName.trim();
    }

    if (companyName !== undefined) {
      user.companyName = companyName.trim();
    }

    if (avatarInitial !== undefined) {
      user.avatarInitial = avatarInitial.trim().slice(0, 1).toUpperCase();
    } else if (fullName !== undefined) {
      user.avatarInitial = fullName.trim().slice(0, 1).toUpperCase();
    }

    const updatedUser = await user.save();

    await createNotification({
      user: req.user,
      title: "Profile Updated",
      message: "Your profile has been updated successfully.",
      type: "info",
      category: "profile",
      actionUrl: "/dashboard/profile",
      icon: "User",
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        companyName: updatedUser.companyName,
        role: updatedUser.role,
        avatarInitial: updatedUser.avatarInitial,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return sendError(
        res,
        400,
        "Current password and new password are required"
      );
    }

    if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      return sendError(
        res,
        400,
        `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`
      );
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return sendError(res, 400, "Current password is incorrect");
    }

    if (currentPassword === newPassword) {
      return sendError(
        res,
        400,
        "New password must be different from the current password"
      );
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
