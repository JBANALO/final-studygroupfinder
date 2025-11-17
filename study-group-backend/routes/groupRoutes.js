import express from "express";
import { createGroup, getGroups } from "../controllers/groupController.js";

const router = express.Router();

router.post("/create", createGroup);
router.get("/all", getGroups);

export default router;
