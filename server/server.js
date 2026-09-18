import dotenv from "dotenv";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL?.trim();

if (!clientUrl) {
  throw new Error("CLIENT_URL is missing in environment variables.");
}

export const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

/* ==========================================
   SOCKET AUTHENTICATION
========================================== */

io.use(async (socket, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error(
        "Socket authentication configuration error: JWT_SECRET is missing."
      );

      return next(
        new Error("Authentication configuration error.")
      );
    }

    const token = socket.handshake.auth?.token;

    if (
      !token ||
      typeof token !== "string" ||
      token.length > 4096
    ) {
      return next(new Error("Not authorized."));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    const userId = decoded?.userId;

    if (!userId || typeof userId !== "string") {
      return next(new Error("Not authorized."));
    }

    const user = await User.findById(userId)
      .select("_id fullName email role isActive companyName")
      .lean();

    if (!user || user.isActive !== true) {
      return next(new Error("Not authorized."));
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error?.name || "UnknownError"
    );

    if (error.name === "TokenExpiredError") {
      return next(new Error("Not authorized. Token expired."));
    }

    return next(new Error("Not authorized."));
  }
});

const PORT = Number(process.env.PORT) || 5000;

/* ==========================================
   START SERVER
========================================== */

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `🚀 AI-BOS Server running on port ${PORT}`
      );
    });

    /* ==========================================
       SOCKET CONNECTION
    ========================================== */

    io.on("connection", (socket) => {
      const userId = String(socket.user._id);

      console.log(
        `✅ Authenticated Socket Connected: ${socket.id}`
      );

      console.log(
        `👤 User: ${socket.user.email}`
      );

      socket.join(userId);

      console.log(
        `✅ ${socket.id} joined authenticated user room`
      );

      socket.on("disconnect", (reason) => {
        console.log(
          `❌ Socket Disconnected: ${socket.id} | ${reason}`
        );
      });
    });
  } catch (error) {
    console.error(
      "❌ Failed to start AI-BOS server:",
      error?.message || "Unknown server error"
    );

    process.exit(1);
  }
};

/* ==========================================
   GRACEFUL SHUTDOWN
========================================== */

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`\n${signal} received. Shutting down AI-BOS...`);

  // Stop accepting new HTTP connections.
  server.close(() => {
    console.log("✅ HTTP server closed.");
  });

  // Disconnect Socket.IO clients immediately so HTTP server can finish closing.
  io.close(() => {
    console.log("✅ Socket.IO server closed.");
  });

  try {
    const mongoose = await import("mongoose");

    if (mongoose.default.connection.readyState !== 0) {
      await mongoose.default.connection.close(false);
      console.log("✅ Database connection closed.");
    }

    console.log("✅ AI-BOS shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Shutdown error:",
      error?.message || "Unknown shutdown error"
    );

    process.exit(1);
  }

  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
