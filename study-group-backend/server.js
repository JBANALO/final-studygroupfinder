// study-group-backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server as IOServer } from "socket.io";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Import Database Pool
import { pool } from "./config/db.js"; 

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import googleRoutes from "./routes/googleRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import schedulesRoutes from "./routes/schedules.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import groupAdminRoutes from "./routes/admin/groupAdminRoutes.js";
import userAdminRoutes from "./routes/admin/userAdminRoutes.js";
import activityRoutes from "./routes/admin/activityRoutes.js";
import notificationRoutes from "./routes/admin/notificationRoutes.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/userRoutes.js";
import notifRoutes from "./routes/notifs.js";
import announcementRoutes from "./routes/announcements.js";
import dashboardRoutes from "./routes/admin/dashboardRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Get frontend URL from environment variable
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ✅ Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  FRONTEND_URL,
  'https://wmsu-study-group-finder-frontend.onrender.com',
  'https://wmsu-study-group-finder.onrender.com',
  'https://final-wmsustudygroup.vercel.app'
];

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

// ✅ Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Updated CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Multer Setup (Local Uploads) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Updated Upload Endpoint - Use environment variable
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  // ✅ Construct public URL using environment variable
  const baseURL = process.env.NODE_ENV === 'production' 
    ? process.env.BACKEND_URL || 'https://wmsu-study-group-finder.onrender.com'
    : 'http://localhost:5000';
  
  const fileUrl = `${baseURL}/uploads/${req.file.filename}`;
  res.json({ fileUrl, filename: req.file.originalname });
});

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    socketConnections: io.engine.clientsCount,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleRoutes);
app.use('/api/password', passwordRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/group", groupRoutes);          // group info & join
app.use("/api/calendar", calendarRoutes);     // schedules / calendar
app.use("/api/schedules", schedulesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", groupAdminRoutes);
app.use("/api/user", userAdminRoutes);
app.use("/api/admin/activities", activityRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifs", notifRoutes);
app.use("/api/announcements", announcementRoutes);

// ✅ Updated Socket.io Setup with proper CORS
const io = new IOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // User joins their personal room for notifications
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined personal room`);
    }
  });

  // User joins a group
  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`📚 Socket ${socket.id} joined group_${groupId}`);
  });

  // User leaves a group
  socket.on("leave_group", (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`🚪 Socket ${socket.id} left group_${groupId}`);
  });

  // Send message to group
  socket.on("send_message", async ({ groupId, sender, text, fileLink }) => {
    try {
      console.log('💬 Message sent to group:', groupId);
      
      // 1. Save to DB
      const [result] = await pool.execute(
        `INSERT INTO group_messages (group_id, sender_id, text, file_link, time)
         VALUES (?, ?, ?, ?, NOW())`,
        [groupId, sender, text || null, fileLink || null]
      );

      // 2. Fetch the new message with sender info
      const [newMsg] = await pool.execute(
        `SELECT 
          gm.id, 
          gm.group_id, 
          gm.sender_id,
          gm.text, 
          gm.file_link AS fileLink, 
          gm.time, 
          u.username AS sender_name
         FROM group_messages gm
         JOIN users u ON gm.sender_id = u.id
         WHERE gm.id = ?`,
        [result.insertId]
      );

      // 3. Broadcast to group
      io.to(`group_${groupId}`).emit("receive_message", {
        groupId: parseInt(groupId),
        message: newMsg[0],
      });

    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  // Schedule created
  socket.on("schedule_created", (schedule) => {
    if (!schedule.groupId) return;
    console.log('📅 Schedule created for group:', schedule.groupId);
    socket.broadcast.to(`group_${schedule.groupId}`).emit("new_schedule", schedule);
  });

  // New announcement
  socket.on("newAnnouncement", (data) => {
    if (!data.group_id) return;
    console.log('📢 Announcement for group:', data.group_id);
    io.to(`group_${data.group_id}`).emit('newAnnouncement', data);
  });

  // Join request approved
  socket.on("request_approved", (data) => {
    if (!data.userId) return;
    console.log('✅ Join request approved:', data);
    io.to(`user_${data.userId}`).emit('request_approved', data);
  });

  // Notification sent
  socket.on("notification", (data) => {
    if (!data.userId) return;
    console.log('🔔 Notification sent to user:', data.userId);
    io.to(`user_${data.userId}`).emit('notification', data);
  });

  // Disconnect
  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", socket.id, "Reason:", reason);
  });

  // Error handling
  socket.on("error", (error) => {
    console.error("🔥 Socket error:", error);
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

// ✅ Start server - bind to 0.0.0.0 for Render
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
    🚀 Server running on port ${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    🔗 Allowed origins: ${allowedOrigins.join(', ')}
  `);
});