import { io } from "socket.io-client";

const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Socket.IO uses the root namespace. If the REST API URL ends with /api,
// remove it so Socket.IO does not try to connect to the /api namespace.
const socketUrl = configuredApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("WebSocket connected");
});

socket.on("disconnect", (reason) => {
  console.log("WebSocket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("WebSocket connection failed:", error.message);
});

export default socket;
