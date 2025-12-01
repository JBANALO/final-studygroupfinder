require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server: IOServer } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO Setup with proper CORS
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join group rooms
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User ${socket.id} joined group-${groupId}`);
  });

  // Leave group rooms
  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User ${socket.id} left group-${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// CORS configuration for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://final-studygroupfinder.vercel.app',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => res.json({ 
  message: 'Study Group API running',
  status: 'ok',
  timestamp: new Date().toISOString()
}));

// Database health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./db');
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});
  

// Temporary migration endpoint - REMOVE after running once!
app.get('/migrate', async (req, res) => {
  try {
    const pool = require('./db'); // ✅ ADD THIS LINE
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        google_id VARCHAR(255),
        is_verified BOOLEAN DEFAULT false,
        verification_code VARCHAR(10),
        reset_password_token VARCHAR(255),
        reset_password_expire TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        bio TEXT,
        profile_photo VARCHAR(255),
        is_admin BOOLEAN DEFAULT false
      );
    `);
    
    res.json({ 
      success: true,
      message: '✅ Migration successful!' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Import routes
const groupRoutes = require('./routes/group');
// Add other routes here as needed
const authRoutes = require('./routes/auth');
// Use routes
app.use('/api/group', groupRoutes);
app.use('/api/auth', authRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

const PORT = process.env.PORT || 5000;

// ✅ Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for:`, allowedOrigins);
  console.log(`🔌 Socket.IO enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});