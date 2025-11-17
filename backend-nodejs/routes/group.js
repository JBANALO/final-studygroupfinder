const express = require('express');
const router = express.Router();
const db = require('../db');

// ----------------------------
// Create Group (creator counted as first member)
router.post('/create', (req, res) => {
  const { group_name, description, created_by, size, course, topic, location } = req.body;

  if (!group_name || !description || !created_by || !size) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const sqlInsertGroup = `
    INSERT INTO groups (group_name, description, created_by, size, current_members, course, topic, location)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
  `;
  db.query(sqlInsertGroup, [group_name, description, created_by, size, course, topic, location], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });

    const groupId = result.insertId;

    const sqlInsertMember = `
      INSERT INTO group_members (group_id, user_id)
      VALUES (?, ?)
    `;
    db.query(sqlInsertMember, [groupId, created_by], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Database error" });

      return res.json({ success: true, message: "Group created successfully", id: groupId });
    });
  });
});

// ----------------------------
// List all groups
router.get('/list', (req, res) => {
  db.query("SELECT * FROM groups ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    return res.json({ success: true, data: results });
  });
});

// ----------------------------
// Join group
router.post('/join', (req, res) => {
  const { groupId, userId } = req.body;

  if (!groupId || !userId) return res.status(400).json({ success: false, message: "groupId and userId required" });

  db.query("SELECT * FROM groups WHERE id = ?", [groupId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Group not found" });

    const group = results[0];
    if (group.current_members >= group.size) return res.status(400).json({ success: false, message: "Group is full" });

    db.query("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId], (err2, memberResults) => {
      if (err2) return res.status(500).json({ success: false, message: "Database error" });
      if (memberResults.length > 0) return res.status(400).json({ success: false, message: "Already joined" });

      db.query("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", [groupId, userId], (err3) => {
        if (err3) return res.status(500).json({ success: false, message: "Database error" });

        db.query("UPDATE groups SET current_members = current_members + 1 WHERE id = ?", [groupId], (err4) => {
          if (err4) return res.status(500).json({ success: false, message: "Database error" });
          return res.json({ success: true, message: "Successfully joined the group" });
        });
      });
    });
  });
});

module.exports = router;
