// controllers/admin/userAdminController.js
import { pool } from "../../config/db.js";

// GET ALL USERS
export const getAdminUserList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, first_name, middle_name, last_name, username, email, is_admin, status FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// TOGGLE ADMIN ROLE
export const toggleAdminRole = async (req, res) => {
  const userId = req.params.id;
  try {
    const [userRows] = await pool.execute(
      "SELECT is_admin FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const newRole = userRows[0].is_admin ? 0 : 1;
    await pool.execute("UPDATE users SET is_admin = ? WHERE id = ?", [newRole, userId]);

    res.json({ message: "User role updated", userId, is_admin: newRole });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
};

// DELETE INACTIVE USER
export const deleteUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const [userRows] = await pool.execute("SELECT status FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) return res.status(404).json({ message: "User not found" });

    if (userRows[0].status === "active") {
      return res.status(400).json({ message: "Cannot delete an active user" });
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};
