import mongoose from "mongoose";

import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

// ======================================================
// ALLOWED USER ROLES
// Must match User.js enum
// ======================================================

const allowedRoles = ["admin", "manager", "user"];

// ======================================================
// HELPERS
// ======================================================

const getCompanyName = (req) =>
  req.user?.companyName || "AI-BOS Workspace";

const isValidId = (id) =>
  mongoose.isValidObjectId(id);

// ======================================================
// SAFE USER RESPONSE
// ======================================================

const getSafeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  companyName: user.companyName,
  role: user.role,
  avatarInitial: user.avatarInitial,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

// ======================================================
// GET TEAM MEMBERS
// ======================================================

export const getTeamMembers = async (
  req,
  res,
  next
) => {
  try {
    const users = await User.find({
      companyName: getCompanyName(req),
    })
      .select(
        "_id fullName email companyName role avatarInitial isActive lastLogin createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// CREATE TEAM MEMBER
// ======================================================

export const createTeamMember = async (
  req,
  res,
  next
) => {
  try {
    const {
      fullName,
      email,
      role,
      password,
    } = req.body;

    // ------------------------------------------
    // REQUIRED FIELDS
    // ------------------------------------------

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email, and password are required",
      });
    }

    const cleanedFullName = fullName.trim();
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // ------------------------------------------
    // NAME VALIDATION
    // ------------------------------------------

    if (cleanedFullName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Full name must be at least 2 characters",
      });
    }

    if (cleanedFullName.length > 80) {
      return res.status(400).json({
        success: false,
        message:
          "Full name cannot exceed 80 characters",
      });
    }

    // ------------------------------------------
    // EMAIL VALIDATION
    // ------------------------------------------

    const emailRegex =
      /^\S+@\S+\.\S+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address",
      });
    }

    // ------------------------------------------
    // PASSWORD VALIDATION
    // ------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "Password cannot exceed 128 characters",
      });
    }

    // ------------------------------------------
    // ROLE VALIDATION
    // ------------------------------------------

    const selectedRole = role || "user";

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // ------------------------------------------
    // CHECK EXISTING USER
    // ------------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User already exists with this email",
      });
    }

    // ------------------------------------------
    // CREATE USER
    // ------------------------------------------

    const user = await User.create({
      fullName: cleanedFullName,
      email: normalizedEmail,
      companyName: getCompanyName(req),
      role: selectedRole,
      password,
      avatarInitial:
        cleanedFullName
          .charAt(0)
          .toUpperCase(),
      isActive: true,
    });

    // ------------------------------------------
    // NOTIFICATION
    // ------------------------------------------

    await createNotification({
      user: req.user,
      title: "Team Member Created",
      message: `${cleanedFullName} was added to your team.`,
      type: "success",
      category: "team",
      actionUrl: "/dashboard/team",
      icon: "Users",
    });

    // ------------------------------------------
    // SAFE RESPONSE
    // ------------------------------------------

    const safeUser = getSafeUser(user);

    return res.status(201).json({
      success: true,
      message:
        "Team member created successfully",
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// UPDATE TEAM MEMBER ROLE
// ======================================================

export const updateTeamMemberRole = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // ------------------------------------------
    // VALIDATE USER ID
    // ------------------------------------------

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ------------------------------------------
    // VALIDATE ROLE
    // ------------------------------------------

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // ------------------------------------------
    // PREVENT SELF DEMOTION
    // ------------------------------------------

    if (
      String(req.user._id) === String(id) &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove admin access from your own account",
      });
    }

    // ------------------------------------------
    // FIND USER WITHIN SAME COMPANY
    // ------------------------------------------

    const user = await User.findOne({
      _id: id,
      companyName: getCompanyName(req),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ------------------------------------------
    // UPDATE ROLE
    // ------------------------------------------

    user.role = role;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User role updated successfully",
      user: getSafeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// TOGGLE TEAM MEMBER STATUS
// ======================================================

export const toggleTeamMemberStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    // ------------------------------------------
    // VALIDATE USER ID
    // ------------------------------------------

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ------------------------------------------
    // FIND USER WITHIN SAME COMPANY
    // ------------------------------------------

    const user = await User.findOne({
      _id: id,
      companyName: getCompanyName(req),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ------------------------------------------
    // PREVENT SELF DEACTIVATION
    // ------------------------------------------

    if (
      String(user._id) ===
      String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot deactivate your own account",
      });
    }

    // ------------------------------------------
    // TOGGLE STATUS
    // ------------------------------------------

    user.isActive = !user.isActive;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: updatedUser.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: getSafeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// DELETE TEAM MEMBER
// ======================================================

export const deleteTeamMember = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    // ------------------------------------------
    // VALIDATE USER ID
    // ------------------------------------------

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ------------------------------------------
    // FIND USER WITHIN SAME COMPANY
    // ------------------------------------------

    const user = await User.findOne({
      _id: id,
      companyName: getCompanyName(req),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ------------------------------------------
    // PREVENT SELF DELETE
    // ------------------------------------------

    if (
      String(user._id) ===
      String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account",
      });
    }

    // ------------------------------------------
    // DELETE USER
    // ------------------------------------------

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Team member deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};