const express = require("express");
const router = express.Router();
const pool = require("../db");

// ----------------------------
// GET all groups (REST standard)
// ----------------------------
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
      error: err.message
    });
  }
});

// ----------------------------
// GET all groups (alternative endpoint)
// ----------------------------
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
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
    const result = await pool.query("SELECT * FROM groups WHERE id = $1", [id]);
    
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
    const { name, description, subject, creator_id } = req.body;
    
    // Validation
    if (!name || !subject || !creator_id) {
      return res.status(400).json({
        success: false,
        message: "Name, subject, and creator_id are required"
      });
    }
    
    const result = await pool.query(
      "INSERT INTO groups (name, description, subject, creator_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, subject, creator_id]
    );
    
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

// ----------------------------
// PUT update group
// ----------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subject } = req.body;
    
    const result = await pool.query(
      "UPDATE groups SET name = $1, description = $2, subject = $3 WHERE id = $4 RETURNING *",
      [name, description, subject, id]
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
