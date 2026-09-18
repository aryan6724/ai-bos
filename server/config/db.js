import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI?.trim();

    if (!uri) {
      throw new Error("MONGODB_URI is missing.");
    }

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 2,
    });

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error?.message || "Unknown database error"
    );

    process.exit(1);
  }
};
