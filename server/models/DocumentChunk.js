import mongoose from "mongoose";

const MAX_CONTENT_LENGTH = 20_000;
const MAX_EMBEDDING_DIMENSIONS = 4_096;

const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    page: {
      type: Number,
      default: null,
      min: 1,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_CONTENT_LENGTH,
    },

    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    embedding: {
      type: [Number],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) &&
          items.length <= MAX_EMBEDDING_DIMENSIONS &&
          items.every((value) => Number.isFinite(value)),
        message: "Invalid chunk embedding",
      },
    },
  },
  {
    timestamps: true,
  }
);

documentChunkSchema.index({ user: 1, document: 1 });
documentChunkSchema.index({ document: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("DocumentChunk", documentChunkSchema);
