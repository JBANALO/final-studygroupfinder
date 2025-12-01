const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT study_groups.*, 
             users.first_name, users.last_name, 
             CONCAT(users.first_name, ' ', users.last_name) as creator_name,
             COUNT(DISTINCT group_members.id) as current_members
      FROM study_groups
      LEFT JOIN users ON study_groups.created_by = users.id
      LEFT JOIN group_members ON study_groups.id = group_members.group_id AND group_members.status = 'approved'
      GROUP BY study_groups.id, users.first_name, users.last_name
      ORDER BY study_groups.created_at DESC
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

router.get("/list", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT study_groups.*, 
             users.first_name, users.last_name, 
             CONCAT(users.first_name, ' ', users.last_name) as creator_name,
             COUNT(DISTINCT group_members.id) as current_members
      FROM study_groups
      LEFT JOIN users ON study_groups.created_by = users.id
      LEFT JOIN group_members ON study_groups.id = group_members.group_id AND group_members.status = 'approved'
      WHERE study_groups.status = 'approved'
      GROUP BY study_groups.id, users.first_name, users.last_name
      ORDER BY study_groups.created_at DESC
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

router.get("/my-groups/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT study_groups.*, 
             COUNT(DISTINCT group_members.id) as current_members
      FROM study_groups
      LEFT JOIN group_members ON study_groups.id = group_members.group_id AND group_members.status = 'approved'
      WHERE study_groups.created_by = $1
      GROUP BY study_groups.id
      ORDER BY study_groups.created_at DESC
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

router.get("/my-joined/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT study_groups.id, study_groups.group_name, study_groups.topic, study_groups.description, 
             study_groups.course, study_groups.location, study_groups.size, study_groups.status,
             COUNT(DISTINCT m2.id) as current_members
      FROM study_groups
      INNER JOIN group_members ON study_groups.id = group_members.group_id
      LEFT JOIN group_members m2 ON study_groups.id = m2.group_id AND m2.status = 'approved'
      WHERE group_members.user_id = $1 AND group_members.status = 'approved'
      GROUP BY study_groups.id
      ORDER BY study_groups.created_at DESC
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

router.post("/join", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    
    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and User ID are required"
      });
    }
    
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
    
    const groupCheck = await pool.query(`
      SELECT study_groups.size, COUNT(group_members.id) as current_members
      FROM study_groups
      LEFT JOIN group_members ON study_groups.id = group_members.group_id AND group_members.status = 'approved'
      WHERE study_groups.id = $1
      GROUP BY study_groups.id, study_groups.size
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

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT study_groups.*, 
             users.first_name, users.last_name, users.username,
             CONCAT(users.first_name, ' ', users.last_name) as creator_name,
             COUNT(DISTINCT group_members.id) as current_members
      FROM study_groups
      LEFT JOIN users ON study_groups.created_by = users.id
      LEFT JOIN group_members ON study_groups.id = group_members.group_id AND group_members.status = 'approved'
      WHERE study_groups.id = $1
      GROUP BY study_groups.id, users.first_name, users.last_name, users.username
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

router.post("/", async (req, res) => {
  try {
    const { group_name, topic, description, course, location, size, created_by } = req.body;
    
    if (!group_name || !course || !size || !created_by) {
      return res.status(400).json({
        success: false,
        message: "Group name, course, size, and creator are required"
      });
    }
    
    const result = await pool.query(
      `INSERT INTO study_groups (group_name, topic, description, course, location, size, created_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING *`,
      [group_name, topic, description, course, location, size, created_by]
    );
    
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

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name, topic, description, course, location, size } = req.body;
    
    const result = await pool.query(
      `UPDATE study_groups 
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

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query("DELETE FROM study_groups WHERE id = $1 RETURNING *", [id]);
    
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