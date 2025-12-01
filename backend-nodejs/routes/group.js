const express = require("express");
const router = express.Router();
const pool = require("../db");

// ----------------------------
// GET all groups (for admin - includes all statuses)
// ----------------------------
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, 
             u.first_name, u.last_name, 
             CONCAT(u.first_name, ' ', u.last_name) as creator_name,
             COUNT(DISTINCT m.id) as current_members
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members m ON g.id = m.group_id AND m.status = 'approved'
      GROUP BY g.id, u.first_name, u.last_name
      ORDER BY g.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching all groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
      error: err.message
    });
  }
});

// ----------------------------
// GET approved groups only (for regular users)
// ----------------------------
router.get("/list", async (req, res) => {
  try {
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
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching approved groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
      error: err.message
    });
  }
});

// ----------------------------
// GET groups created by a specific user
// ----------------------------
router.get("/my-groups/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT g.*, 
             COUNT(DISTINCT m.id) as current_members
      FROM groups g
      LEFT JOIN group_members m ON g.id = m.group_id AND m.status = 'approved'
      WHERE g.created_by = $1
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching user's groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your groups",
      error: err.message
    });
  }
});

// ----------------------------
// GET groups a user has joined (approved memberships)
// ----------------------------
router.get("/my-joined/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT g.id, g.group_name, g.topic, g.description, g.course, g.location, g.size, g.status,
             COUNT(DISTINCT m2.id) as current_members
      FROM groups g
      INNER JOIN group_members m ON g.id = m.group_id
      LEFT JOIN group_members m2 ON g.id = m2.group_id AND m2.status = 'approved'
      WHERE m.user_id = $1 AND m.status = 'approved'
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching joined groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch joined groups",
      error: err.message
    });
  }
});

// ----------------------------
// POST - Join a group (send join request)
// ----------------------------
router.post("/join", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    
    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and User ID are required"
      });
    }
    
    // Check if user already has a membership
    const existing = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );
    
    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      return res.json({
        success: false,
        message: status === 'approved' 
          ? 'You are already a member of this group' 
          : 'Your join request is pending approval'
      });
    }
    
    // Check if group is full
    const groupCheck = await pool.query(`
      SELECT g.size, COUNT(m.id) as current_members
      FROM groups g
      LEFT JOIN group_members m ON g.id = m.group_id AND m.status = 'approved'
      WHERE g.id = $1
      GROUP BY g.id, g.size
    `, [groupId]);
    
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    const { size, current_members } = groupCheck.rows[0];
    if (parseInt(current_members) >= parseInt(size)) {
      return res.json({
        success: false,
        message: 'This group is already full'
      });
    }
    
    // Create join request with 'pending' status
    await pool.query(
      "INSERT INTO group_members (group_id, user_id, status) VALUES ($1, $2, 'pending')",
      [groupId, userId]
    );
    
    res.json({
      success: true,
      message: 'Join request sent successfully'
    });
  } catch (err) {
    console.error("Error joining group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send join request",
      error: err.message
    });
  }
});

// ----------------------------
// GET single group by ID
// ----------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT g.*, 
             u.first_name, u.last_name, u.username,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name,
             COUNT(DISTINCT m.id) as current_members
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members m ON g.id = m.group_id AND m.status = 'approved'
      WHERE g.id = $1
      GROUP BY g.id, u.first_name, u.last_name, u.username
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group",
      error: err.message
    });
  }
});

// ----------------------------
// POST create new group
// ----------------------------
router.post("/", async (req, res) => {
  try {
    const { group_name, topic, description, course, location, size, created_by } = req.body;
    
    // Validation
    if (!group_name || !course || !size || !created_by) {
      return res.status(400).json({
        success: false,
        message: "Group name, course, size, and creator are required"
      });
    }
    
    const result = await pool.query(
      `INSERT INTO groups (group_name, topic, description, course, location, size, created_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING *`,
      [group_name, topic, description, course, location, size, created_by]
    );
    
    // Emit socket event for admin notification
    const io = req.app.get('io');
    if (io) {
      io.emit('newPendingGroup', result.rows[0]);
    }
    
    res.status(201).json({
      success: true,
      message: "Group created successfully and pending approval",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: err.message
    });
  }
});

// ----------------------------
// PUT update group
// ----------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name, topic, description, course, location, size } = req.body;
    
    const result = await pool.query(
      `UPDATE groups 
       SET group_name = $1, topic = $2, description = $3, course = $4, location = $5, size = $6, updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [group_name, topic, description, course, location, size, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    
    res.json({
      success: true,
      message: "Group updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update group",
      error: err.message
    });
  }
});

// ----------------------------
// DELETE group
// ----------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query("DELETE FROM groups WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
    
    res.json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete group",
      error: err.message
    });
  }
});

module.exports = router;