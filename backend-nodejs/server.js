require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server: IOServer } = require('socket.io');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://victorious-fascination-production.up.railway.app',
  'http://localhost:4173',
  'http://localhost:5173'
];

const io = new IOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User ${socket.id} joined group-${groupId}`);
  });

  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User ${socket.id} left group-${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

app.use(cors({
  origin: [
    'https://victorious-fascination-production.up.railway.app',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    message: 'Study Group API running',
    status: 'ok',
    timestamp: new Date().toISOString(),
    cors: allowedOrigins
  });
});

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

// Migration endpoint - creates group tables
app.get('/migrate-groups', async (req, res) => {
  try {
    const pool = require('./db');
    
    console.log('🔄 Starting group tables migration...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        group_name VARCHAR(255) NOT NULL,
        topic VARCHAR(255),
        description TEXT,
        course VARCHAR(100),
        location VARCHAR(255),
        size INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Groups table created/verified');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      );
    `);
    console.log('✅ Group_members table created/verified');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Messages table created/verified');
    
    res.json({ 
      success: true,
      message: '✅ Group tables created successfully!' 
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Debug endpoint - check database structure
app.get('/api/debug/tables', async (req, res) => {
  try {
    const pool = require('./db');
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('groups', 'group_members', 'messages', 'users')
      ORDER BY table_name
    `);
    
    // Check columns in groups table
    const groupsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'groups'
      ORDER BY ordinal_position
    `);
    
    // Check columns in group_members table
    const membersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'group_members'
      ORDER BY ordinal_position
    `);
    
    // Count records
    const groupCount = await pool.query('SELECT COUNT(*) FROM groups');
    const memberCount = await pool.query('SELECT COUNT(*) FROM group_members');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    
    // Try a simple groups query
    const testQuery = await pool.query('SELECT * FROM groups LIMIT 1');
    
    res.json({
      success: true,
      tables_found: tables.rows.map(t => t.table_name),
      groups_columns: groupsColumns.rows,
      group_members_columns: membersColumns.rows,
      record_counts: {
        groups: parseInt(groupCount.rows[0].count),
        members: parseInt(memberCount.rows[0].count),
        users: parseInt(userCount.rows[0].count)
      },
      sample_group: testQuery.rows[0] || null
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      detail: error.detail,
      hint: error.hint
    });
  }
});

// Debug endpoint - test group list query
app.get('/api/debug/test-query', async (req, res) => {
  try {
    const pool = require('./db');
    
    console.log('Testing group list query...');
    
    const result = await pool.query(`
      SELECT g.*, 
             u.first_name, u.last_name, 
             CONCAT(u.first_name, ' ', u.last_name) as creator_name,
             COUNT(DISTINCT m.id) as current_members
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members m ON g.id = m.group_id AND m.status = 'approved'
      WHERE g.status = 'approved'
      GROUP BY g.id, u.first_name, u.last_name
      ORDER BY g.created_at DESC
    `);
    
    res.json({
      success: true,
      query: 'group list query',
      row_count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Query test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

const groupRoutes = require('./routes/group');
const authRoutes = require('./routes/auth');

app.use('/api/group', groupRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for:`, allowedOrigins);
  console.log(`🔌 Socket.IO enabled`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});