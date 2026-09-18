import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [80, "Full name cannot exceed 80 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      maxlength: [254, "Email cannot exceed 254 characters"],
    },

    companyName: {
      type: String,
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
      default: "Aryan Technologies",
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password cannot exceed 128 characters"],
      select: false,
    },

    // Password reset fields.
    // Only the SHA-256 hash of the reset token is stored.
    passwordResetTokenHash: {
      type: String,
      select: false,
      index: true,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
      index: true,
    },

    // Used to invalidate JWTs issued before a successful password reset.
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "user"],
      default: "user",
      index: true,
    },

    avatarInitial: {
      type: String,
      trim: true,
      maxlength: 2,
      default: "A",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// Database Indexes
// =========================================

// email: unique: true already creates a unique index.
userSchema.index({ companyName: 1 });
userSchema.index({ companyName: 1, isActive: 1 });

// Hash password before saving.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare plain password with hashed password.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user object without password or reset-security fields.
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    companyName: this.companyName,
    role: this.role,
    avatarInitial: this.avatarInitial,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
