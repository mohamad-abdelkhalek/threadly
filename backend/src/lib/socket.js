// Import required modules
import { Server } from "socket.io";
import http from "http";
import express from "express";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Allow connections from this origin
  },
});

// Map to store online users: { userId: socketId }
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Add user to userSocketMap using their userId from the handshake query
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Notify all clients about the updated list of online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId]; // Remove user from the map
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Notify clients
  });
});

// Export io, app, and server for use in other modules
export { io, app, server };
