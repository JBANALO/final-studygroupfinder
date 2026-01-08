const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all groups
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT groups.group_id as id, 
             groups.group_name, 
             groups.description, 
             groups.subject,
             groups.max_member,
             groups.created_by,
             groups.created_at,
             groups.updated_at,
             users.first_name, 
             users.last_name, 
             CONCAT(users.first_name, ' ', users.last_name) as creator_name,
             COUNT(DISTINCT group_members.id) as current_members
      FROM groups
      LEFT JOIN users ON groups.created_by = users.id
      LEFT JOIN group_members ON groups.group_id = group_members.group_id AND group_members.status = 'approved'
      GROUP BY groups.group_id, users.first_name, users.last_name
      ORDER BY groups.created_at DESC
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

// Get approved groups (for listing page)
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT groups.group_id as id, 
             groups.group_name, 
             groups.description, 
             groups.subject,
             groups.max_member,
             groups.created_by,
             groups.created_at,
             users.first_name, 
             users.last_name, 
             CONCAT(users.first_name, ' ', users.last_name) as creator_name,
             COUNT(DISTINCT group_members.id) as current_members
      FROM groups
      LEFT JOIN users ON groups.created_by = users.id
      LEFT JOIN group_members ON groups.group_id = group_members.group_id AND group_members.status = 'approved'
      GROUP BY groups.group_id, users.first_name, users.last_name
      ORDER BY groups.created_at DESC
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

// Get user's created groups
router.get("/my-groups/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT groups.group_id as id, 
             groups.group_name, 
             groups.description, 
             groups.subject,
             groups.max_member,
             groups.created_by,
             groups.created_at,
             COUNT(DISTINCT group_members.id) as current_members
      FROM groups
      LEFT JOIN group_members ON groups.group_id = group_members.group_id AND group_members.status = 'approved'
      WHERE groups.created_by = $1
      GROUP BY groups.group_id
      ORDER BY groups.created_at DESC
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

// Get groups user has joined
router.get("/my-joined/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT groups.group_id as id, 
             groups.group_name, 
             groups.description, 
             groups.subject,
             groups.max_member,
             groups.created_by,
             groups.created_at,
             COUNT(DISTINCT m2.id) as current_members
      FROM groups
      INNER JOIN group_members ON groups.group_id = group_members.group_id
      LEFT JOIN group_members m2 ON groups.group_id = m2.group_id AND m2.status = 'approved'
      WHERE group_members.user_id = $1 AND group_members.status = 'approved'
      GROUP BY groups.group_id
      ORDER BY groups.created_at DESC
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

// Join a group
router.post("/join", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    
    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and User ID are required"
      });
    }
    
    // Check if already a member
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
      SELECT groups.max_member, COUNT(group_members.id) as current_members
      FROM groups
      LEFT JOIN group_members ON groups.group_id = group_members.group_id AND group_members.status = 'approved'
      WHERE groups.group_id = $1
      GROUP BY groups.group_id, groups.max_member
    `, [groupId]);
    
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    const { max_member, current_members } = groupCheck.rows[0];
    if (parseInt(current_members) >= parseInt(max_member)) {
      return res.json({
        success: false,
        message: 'This group is already full'
      });
    }
    
    // Add join request
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

// Create new group
router.post("/", async (req, res) => {
  try {
    const { group_name, subject, description, max_member, created_by } = req.body;
    
    if (!group_name || !subject || !max_member || !created_by) {
      return res.status(400).json({
        success: false,
        message: "Group name, subject, max members, and creator are required"
      });
    }
    
    const result = await pool.query(
      `INSERT INTO groups (group_name, subject, description, max_member, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING group_id as id, group_name, subject, description, max_member, created_by, created_at`,
      [group_name, subject, description, max_member, created_by]
    );
    
    const io = req.app.get('io');
    if (io) {
      io.emit('newPendingGroup', result.rows[0]);
    }
    
    res.status(201).json({
      success: true,
      message: "Group created successfully",
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

// Update group
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name, subject, description, max_member } = req.body;
    
    const result = await pool.query(
      `UPDATE groups 
       SET group_name = $1, subject = $2, description = $3, max_member = $4, updated_at = NOW()
       WHERE group_id = $5 
       RETURNING group_id as id, group_name, subject, description, max_member, created_by, created_at, updated_at`,
      [group_name, subject, description, max_member, id]
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

// Delete group
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "DELETE FROM groups WHERE group_id = $1 RETURNING group_id as id, group_name",
      [id]
    );
    
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


// ⚠️ MOVE THIS TO THE VERY BOTTOM - LAST ROUTE
// Get single group by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT groups.group_id as id, 
             groups.group_name, 
             groups.description, 
             groups.subject,
             groups.max_member,
             groups.created_by,
             groups.created_at,
             users.first_name, 
             users.last_name, 
             users.username,
             CONCAT(users.first_name, ' ', users.last_name) as creator_name,
             COUNT(DISTINCT group_members.id) as current_members
      FROM groups
      LEFT JOIN users ON groups.created_by = users.id
      LEFT JOIN group_members ON groups.group_id = group_members.group_id AND group_members.status = 'approved'
      WHERE groups.group_id = $1
      GROUP BY groups.group_id, users.first_name, users.last_name, users.username
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

module.exports = router;
