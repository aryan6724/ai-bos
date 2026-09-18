import mongoose from "mongoose";

const MAX_QUESTION_LENGTH = 10_000;
const MAX_ANSWER_LENGTH = 100_000;
const MAX_SOURCES = 20;
const MAX_PREVIEW_LENGTH = 1_000;

const documentChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_QUESTION_LENGTH,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_ANSWER_LENGTH,
    },

    feedback: {
      type: String,
      enum: ["like", "dislike", null],
      default: null,
    },

    sources: {
      type: [
        {
          chunkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DocumentChunk",
            default: null,
          },

          chunkIndex: {
            type: Number,
            default: null,
            min: 0,
          },

          page: {
            type: Number,
            default: null,
            min: 1,
          },

          score: {
            type: Number,
            default: null,
            min: -1,
            max: 1,
          },

          preview: {
            type: String,
            default: "",
            trim: true,
            maxlength: MAX_PREVIEW_LENGTH,
          },
        },
      ],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length <= MAX_SOURCES,
        message: `A chat response cannot contain more than ${MAX_SOURCES} sources`,
      },
    },

    provider: {
      type: String,
      enum: ["gemini", "openai"],
      required: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

documentChatSchema.index({ user: 1, document: 1, createdAt: 1 });
documentChatSchema.index({ user: 1, createdAt: -1 });

const DocumentChat = mongoose.model("DocumentChat", documentChatSchema);

export default DocumentChat;
