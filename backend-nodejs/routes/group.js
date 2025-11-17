const express = require('express');
const router = express.Router();
const db = require('../db');

// ----------------------------
// Create Group
router.post('/create', (req, res) => {
  const {
    group_name,
    description,
    created_by,
    size,
    space_available,
    course,
    topic,
    location
  } = req.body;

  // Validate required fields
  if (!group_name || !description || !created_by || !size || !space_available || !course || !topic || !location) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const sqlInsertGroup = `
    INSERT INTO groups 
      (group_name, description, created_by, size, space_available, current_members, course, topic, location)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
  `;

  db.query(
    sqlInsertGroup,
    [group_name, description, created_by, size, space_available, course, topic, location],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      const groupId = result.insertId;

      const sqlInsertMember = `
        INSERT INTO group_members (group_id, user_id)
        VALUES (?, ?)
      `;

      db.query(sqlInsertMember, [groupId, created_by], (err2) => {
        if (err2) {
          console.log(err2);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        return res.json({
          success: true,
          message: "Group created successfully",
          id: groupId
        });
      });
    }
  );
});

// ----------------------------
// List Groups
router.get('/list', (req, res) => {
  db.query("SELECT * FROM groups ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, data: results });
  });
});

module.exports = router;
