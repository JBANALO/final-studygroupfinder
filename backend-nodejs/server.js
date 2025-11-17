require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = express.json();

const app = express();
app.use(cors());
app.use(bodyParser);

// MySQL pool
const mysql = require('mysql2');
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Example route: health check
app.get('/', (req, res) => {
  res.json({ message: 'Node.js backend running' });
});

// Import more routes later...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const groupRoutes = require('./routes/group');
app.use('/api/group', groupRoutes);
