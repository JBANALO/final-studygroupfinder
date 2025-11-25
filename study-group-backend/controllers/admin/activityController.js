// controllers/admin/activityController.js
import { pool } from "../../config/db.js";

// GET RECENT ADMIN ACTIVITIES
export const getRecentActivities = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        a.id,
        u.first_name AS user_first,
        u.last_name AS user_last,
        a.action,
        a.target,
        a.created_at
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    
    res.json(rows);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to fetch activities", error: err.message });
  }
};
