import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

let mongoServer = null;

export const setupTestDatabase = async () => {
  try {
    console.log("🧪 Starting MongoDB Memory Server...");

    mongoServer = await MongoMemoryServer.create();

    const uri = mongoServer.getUri();

    console.log("🧪 MongoDB Memory Server started.");
    console.log("🧪 Preparing Mongoose connection...");

    // Make sure no previous MongoDB connection is active.
    if (mongoose.connection.readyState !== 0) {
      console.log("⚠️ Closing existing Mongoose connection...");

      await mongoose.disconnect();
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ Test MongoDB connected.");
  } catch (error) {
    console.error(
      "❌ Test MongoDB setup failed:",
      error?.message || error
    );

    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (disconnectError) {
      console.error(
        "⚠️ Mongoose disconnect failed:",
        disconnectError?.message || disconnectError
      );
    }

    try {
      if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
      }
    } catch (stopError) {
      console.error(
        "⚠️ MongoDB Memory Server stop failed:",
        stopError?.message || stopError
      );
    }

    throw error;
  }
};

export const clearTestDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error(
      "⚠️ Test MongoDB disconnect failed:",
      error?.message || error
    );
  }

  try {
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  } catch (error) {
    console.error(
      "⚠️ MongoDB Memory Server stop failed:",
      error?.message || error
    );
  }
};