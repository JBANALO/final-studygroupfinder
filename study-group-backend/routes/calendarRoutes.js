import express from "express";
import { createEvent } from "../utils/googleCalendar.js";

const router = express.Router();

// POST /api/calendar/create
router.post("/create", async (req, res) => {
  try {
    const { summary, description, start, end, attendees } = req.body;

    const event = {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees?.map(email => ({ email })) || [],
    };

    const result = await createEvent(event);
    res.status(201).json({ success: true, event: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
