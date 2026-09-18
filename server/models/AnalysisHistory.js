import mongoose from "mongoose";

const MAX_TEXT_LENGTH = 200_000;
const MAX_DOCUMENT_NAME_LENGTH = 255;
const MAX_KEYWORDS = 1_000;

const limitedStringArray = {
  type: [String],
  default: [],
  validate: {
    validator: (items) =>
      Array.isArray(items) &&
      items.length <= MAX_KEYWORDS &&
      items.every(
        (item) => typeof item === "string" && item.length <= 200
      ),
    message: "Invalid keywords data",
  },
};

const analysisHistorySchema = new mongoose.Schema(
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

    documentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_DOCUMENT_NAME_LENGTH,
    },

    documentType: {
      type: String,
      default: "General",
      trim: true,
      maxlength: 100,
    },

    output: {
      type: String,
      default: "",
      maxlength: MAX_TEXT_LENGTH,
    },

    sections: {
      summary: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      keyPoints: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      keyInformation: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      importantDates: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      importantNumbers: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      risksAndIssues: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      actionItems: { type: String, default: "", maxlength: MAX_TEXT_LENGTH },
      keywords: limitedStringArray,
    },

    provider: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    model: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    analyzedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

analysisHistorySchema.index({
  user: 1,
  document: 1,
  analyzedAt: -1,
});

analysisHistorySchema.index({
  user: 1,
  analyzedAt: -1,
});

export default mongoose.model("AnalysisHistory", analysisHistorySchema);
