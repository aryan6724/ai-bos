import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "New Chat",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lastMessage: {
      type: String,
      default: "",
      trim: true,
    },

    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    archived: {
      type: Boolean,
      default: false,
      index: true,
    },

    metadata: {
      topic: {
        type: String,
        default: "",
        trim: true,
        maxlength: 80,
      },

      intent: {
        type: String,
        default: "",
        trim: true,
        maxlength: 80,
      },

      category: {
        type: String,
        enum: [
          "business",
          "programming",
          "documents",
          "ai",
          "productivity",
          "technical-support",
          "general",
        ],
        default: "general",
        index: true,
      },

      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
        index: true,
      },

      keywords: {
        type: [String],
        default: [],
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },

      generatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup for the authenticated user's active workspace.
conversationSchema.index({
  user: 1,
  archived: 1,
  pinned: -1,
  updatedAt: -1,
});

export default mongoose.model(
  "Conversation",
  conversationSchema
);
