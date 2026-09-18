import mongoose from "mongoose";

const MAX_TITLE_LENGTH = 200;
const MAX_INPUT_LENGTH = 50_000;
const MAX_OUTPUT_LENGTH = 100_000;

const generationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["resume", "email", "report"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_TITLE_LENGTH,
    },

    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (value) => {
          try {
            return JSON.stringify(value).length <= MAX_INPUT_LENGTH;
          } catch {
            return false;
          }
        },
        message: "Generation input is too large or invalid",
      },
    },

    output: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_OUTPUT_LENGTH,
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

generationSchema.index({ user: 1, createdAt: -1 });
generationSchema.index({ user: 1, type: 1, createdAt: -1 });

const Generation = mongoose.model("Generation", generationSchema);

export default Generation;
