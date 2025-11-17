import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function testDB() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    console.log("✅ Connected to MySQL!");
    await conn.end();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
}

testDB();
