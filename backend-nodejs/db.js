const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused. Check if PostgreSQL is running.');
    }
    if (err.code === '28P01') {
      console.error('Invalid username or password.');
    }
    if (err.code === '3D000') {
      console.error('Database does not exist.');
    }
  } else {
    console.log('✅ PostgreSQL database connected successfully');
    console.log('📊 Connected to Render PostgreSQL database');
    release();
  }
});

// Handle connection errors
pool.on('error', (err, client) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
