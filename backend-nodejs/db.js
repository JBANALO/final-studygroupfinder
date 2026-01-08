const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL database connected successfully');
    console.log('📊 Connected to Railway MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused. Check if MySQL is running.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Invalid username or password.');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist.');
    }
  });

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
