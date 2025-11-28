const express = require("express");
const router = express.Router();
const pool = require("../db"); // Changed from 'db' to 'pool' for promise-based

// ----------------------------
// GET all groups (REST standard)
router.get("/", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ----------------------------
// List all groups (legacy route)
router.get("/list", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ----------------------------
// Create Group
router.post("/create", async (req, res) => {
  const {
    group_name,
    description,
    created_by,
    size,
    course,
    topic,
    location,
  } = req.body;

  if (!group_name || !description || !created_by || !size || !course || !topic || !location) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const sqlInsertGroup = `
      INSERT INTO groups 
        (group_name, description, created_by, size, current_members, course, topic, location, status)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(
      sqlInsertGroup,
      [group_name, description, created_by, size, course, topic, location]
    );

    const groupId = result.insertId;

    // Add the creator to group_members
    const sqlInsertMember = `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`;
    await pool.query(sqlInsertMember, [groupId, created_by]);

    return res.json({
      success: true,
      message: "Group created successfully, waiting for admin approval",
      group: {
        id: groupId,
        group_name,
        description,
        created_by,
        size,
        course,
        topic,
        location,
        current_members: 1,
        status: "pending",
      },
    });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ----------------------------
// GET user-specific group status
router.get("/user-status/:userId", async (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT g.id, g.group_name, g.status, g.remarks
    FROM groups g
    WHERE g.created_by = ?
  `;
  
  try {
    const [results] = await pool.query(sql, [userId]);
    const data = {};
    results.forEach(g => {
      data[g.id] = g.status;
      data[g.id + "_remarks"] = g.remarks || "";
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching user status:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ----------------------------
// Get messages for a group
router.get("/:groupId/messages", async (req, res) => {
  const { groupId } = req.params;
  const sql = "SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at ASC";
  
  try {
    const [results] = await pool.query(sql, [groupId]);
    res.json({ success: true, messages: results });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ success: false, message: "Database error", err: err.message });
  }
});

// ----------------------------
// Post a message to a group
router.post("/:groupId/message", async (req, res) => {
  const { groupId } = req.params;
  const { sender, text, fileLink } = req.body;

  if (!sender || (!text && !fileLink)) {
    return res.status(400).json({ success: false, message: "Message text or file required" });
  }

  const sql = `
    INSERT INTO group_messages (group_id, user_id, message, file_link, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  const params = [groupId, sender, text || "", fileLink || null];

  try {
    await pool.query(sql, params);

    const [results] = await pool.query(
      "SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at ASC",
      [groupId]
    );

    // Socket.IO notification (if implemented)
    const io = req.app.get("io");
    if (io) {
      io.to(`group_${groupId}`).emit("newNotification", {
        type: "message",
        groupId,
        sender,
        text,
        time: new Date(),
      });
    }

    res.json({ success: true, messages: results });
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).json({ success: false, message: "Database error", err: err.message });
  }
});

// ----------------------------
// GET single group by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [results] = await pool.query("SELECT * FROM groups WHERE id = ?", [id]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ----------------------------
// UPDATE group
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { group_name, description, size, course, topic, location, status } = req.body;
  
  const sql = `
    UPDATE groups 
    SET group_name = ?, description = ?, size = ?, course = ?, topic = ?, location = ?, status = ?
    WHERE id = ?
  `;
  
  try {
    const [result] = await pool.query(sql, [group_name, description, size, course, topic, location, status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    res.json({ success: true, message: "Group updated successfully" });
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ----------------------------
// DELETE group
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.query("DELETE FROM groups WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    res.json({ success: true, message: "Group deleted successfully" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

module.exports = router;
