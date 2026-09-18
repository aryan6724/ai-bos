import mongoose from "mongoose";

const MAX_TEXT_LENGTH = 2_000;
const MAX_METADATA_LENGTH = 20_000;

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      default: "AI-BOS Workspace",
      trim: true,
      maxlength: 150,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    resourceId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: MAX_TEXT_LENGTH,
    },

    method: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },

    path: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2_000,
    },

    statusCode: {
      type: Number,
      default: 200,
      min: 100,
      max: 599,
    },

    outcome: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
      index: true,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1_000,
    },

    durationMs: {
      type: Number,
      default: 0,
      min: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      validate: {
        validator: (value) => {
          try {
            return JSON.stringify(value).length <= MAX_METADATA_LENGTH;
          } catch {
            return false;
          }
        },
        message: "Audit metadata is too large or invalid",
      },
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ companyName: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ companyName: 1, action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
