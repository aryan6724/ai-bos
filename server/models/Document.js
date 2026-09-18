import mongoose from "mongoose";

const MAX_DOCUMENT_TEXT = 5_000_000;
const MAX_SUMMARY_LENGTH = 50_000;
const MAX_AI_OUTPUT_LENGTH = 200_000;
const MAX_CHUNK_TEXT_LENGTH = 20_000;
const MAX_CHUNKS = 5_000;
const MAX_EMBEDDING_DIMENSIONS = 4_096;
const MAX_ENTITY_ITEMS = 1_000;

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    size: {
      type: Number,
      required: true,
      min: [1, "Document size must be greater than 0"],
      max: [20 * 1024 * 1024, "Document size cannot exceed 20 MB"],
    },

    storagePath: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1_000,
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
      index: true,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "general",
    },

    text: {
      type: String,
      default: "",
      maxlength: MAX_DOCUMENT_TEXT,
    },

    pages: {
      type: Number,
      default: 0,
      min: 0,
    },

    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    language: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "en",
    },

    isIndexed: {
      type: Boolean,
      default: false,
      index: true,
    },

    summary: {
      type: String,
      default: "",
      maxlength: MAX_SUMMARY_LENGTH,
    },

    keywords: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) &&
          items.length <= MAX_ENTITY_ITEMS &&
          items.every(
            (item) =>
              typeof item === "string" && item.length <= 200
          ),
        message: "Invalid keywords data",
      },
    },

    // ===========================
    // AI Document Intelligence
    // ===========================

    aiAnalysis: {
      output: {
        type: String,
        default: "",
        maxlength: MAX_AI_OUTPUT_LENGTH,
      },

      sections: {
        summary: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        keyPoints: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        keyInformation: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        importantDates: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        importantNumbers: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        risksAndIssues: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        actionItems: {
          type: String,
          default: "",
          maxlength: MAX_SUMMARY_LENGTH,
        },

        keywords: {
          type: [String],
          default: [],
          validate: {
            validator: (items) =>
              Array.isArray(items) &&
              items.length <= MAX_ENTITY_ITEMS &&
              items.every(
                (item) =>
                  typeof item === "string" && item.length <= 200
              ),
            message: "Invalid AI keywords data",
          },
        },
      },

      provider: {
        type: String,
        trim: true,
        maxlength: 50,
        default: "",
      },

      model: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      analyzedAt: {
        type: Date,
      },
    },

    entities: {
      people: {
        type: [String],
        default: [],
        validate: {
          validator: (items) =>
            Array.isArray(items) &&
            items.length <= MAX_ENTITY_ITEMS &&
            items.every(
              (item) =>
                typeof item === "string" && item.length <= 200
            ),
          message: "Invalid people entities",
        },
      },

      organizations: {
        type: [String],
        default: [],
        validate: {
          validator: (items) =>
            Array.isArray(items) &&
            items.length <= MAX_ENTITY_ITEMS &&
            items.every(
              (item) =>
                typeof item === "string" && item.length <= 200
            ),
          message: "Invalid organization entities",
        },
      },

      dates: {
        type: [String],
        default: [],
        validate: {
          validator: (items) =>
            Array.isArray(items) &&
            items.length <= MAX_ENTITY_ITEMS &&
            items.every(
              (item) =>
                typeof item === "string" && item.length <= 200
            ),
          message: "Invalid date entities",
        },
      },

      amounts: {
        type: [String],
        default: [],
        validate: {
          validator: (items) =>
            Array.isArray(items) &&
            items.length <= MAX_ENTITY_ITEMS &&
            items.every(
              (item) =>
                typeof item === "string" && item.length <= 200
            ),
          message: "Invalid amount entities",
        },
      },
    },

    documentType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "General",
    },

    embedding: {
      type: [Number],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) &&
          items.length <= MAX_EMBEDDING_DIMENSIONS &&
          items.every((value) => Number.isFinite(value)),
        message: "Invalid document embedding",
      },
    },

    // ==============================
    // RAG / AI Processing
    // ==============================

    chunks: {
      type: [
        {
          text: {
            type: String,
            default: "",
            maxlength: MAX_CHUNK_TEXT_LENGTH,
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

          page: {
            type: Number,
            default: 1,
            min: 1,
          },
        },
      ],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length <= MAX_CHUNKS,
        message: `A document cannot contain more than ${MAX_CHUNKS} chunks`,
      },
    },

    processedAt: {
      type: Date,
    },

    indexedAt: {
      type: Date,
    },

    source: {
      type: String,
      enum: ["upload", "api", "email"],
      default: "upload",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==============================
// PERFORMANCE INDEXES
// ==============================

documentSchema.index({
  user: 1,
  isDeleted: 1,
  updatedAt: -1,
});

documentSchema.index({
  user: 1,
  category: 1,
  isDeleted: 1,
});

documentSchema.index({
  user: 1,
  status: 1,
  isDeleted: 1,
});

documentSchema.index({
  user: 1,
  isIndexed: 1,
  isDeleted: 1,
});

const Document = mongoose.model("Document", documentSchema);

export default Document;
