import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// GET all messages for a group
router.get("/:groupId/messages", async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);
  try {
    const [messages] = await pool.execute(
      `SELECT 
         gm.id, 
         gm.sender_id,
         gm.text, 
         gm.file_link AS fileLink,
         DATE_FORMAT(gm.time, '%h:%i %p') AS time,
         u.username AS sender_name
       FROM group_messages gm
       JOIN users u ON gm.sender_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.time ASC`,
      [groupId]
    );
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

export default router;