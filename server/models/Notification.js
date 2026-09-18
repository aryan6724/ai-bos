import mongoose from "mongoose";

const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_ACTION_URL_LENGTH = 2_000;
const MAX_METADATA_LENGTH = 10_000;

const notificationSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_TITLE_LENGTH,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_MESSAGE_LENGTH,
    },

    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
      index: true,
    },

    category: {
      type: String,
      enum: [
        "team",
        "document",
        "profile",
        "billing",
        "ai",
        "system",
        "security",
      ],
      default: "system",
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    actionUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: MAX_ACTION_URL_LENGTH,
    },

    icon: {
      type: String,
      default: "Bell",
      trim: true,
      maxlength: 50,
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
        message: "Notification metadata is too large or invalid",
      },
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ companyName: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
