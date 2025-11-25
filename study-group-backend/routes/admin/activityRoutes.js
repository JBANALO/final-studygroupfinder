import express from "express";
import { getRecentActivities } from "../../controllers/admin/activityController.js";

const router = express.Router();

// GET recent activities
router.get("/", getRecentActivities);

export default router;
