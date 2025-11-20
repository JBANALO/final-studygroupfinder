const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// --- MySQL pool ---
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use((req, res, next) => {
  req.db = db;
  next();
});

// --- Routes ---
const groupRoutes = require("./routes/group");
app.use("/api/group", groupRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// --- HTTP & Socket.io setup ---
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // frontend URL
    methods: ["GET", "POST"],
  },
});

// --- Socket.io real-time messaging ---
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a group/room
  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });

  // Send a message (text or file)
  socket.on("send_message", ({ groupId, message }) => {
    if (!groupId || !message.sender || (!message.text && !message.fileLink)) return;

    const query = `
      INSERT INTO messages (group_id, sender, text, file_link, time)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [groupId, message.sender, message.text || "", message.fileLink || null, new Date()];

    db.query(query, params, (err) => {
      if (err) console.error("DB insert error:", err);
    });

    // Emit the message to everyone in the same group
    io.to(`group_${groupId}`).emit("receive_message", { groupId, message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
