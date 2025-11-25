// controllers/calendarController.js
import { pool } from "../config/db.js";
import { createEvent } from "../utils/googleCalendar.js";

export const getGroupSchedules = async (req, res) => {
  const { groupId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM schedules WHERE groupId = ? ORDER BY start ASC",
      [groupId]
    );

    const schedules = rows.map(s => ({
      ...s,
      attendees: JSON.parse(s.attendees || "[]"),
      meetingType: s.meetingType || "physical",
      meetingLink: s.meetingLink || null
    }));

    res.json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB Error" });
  }
};

export const createGroupSchedule = async (req, res) => {
  const { groupId } = req.params;
  const { title, start, end, location = "Online", description = "", meetingType = "physical" } = req.body;

  if (!title || !start || !end) {
    return res.status(400).json({ success: false, message: "Title, start, and end are required" });
  }

  try {
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();

    // Pass meetingType instead of conferenceData
    const googleEvent = await createEvent({ title, description, location, start: startISO, end: endISO, meetingType });

    // Hangout/Meet link
    let meetingLink = null;
    if (meetingType === "online") {
      meetingLink = googleEvent.hangoutLink || null;
      console.log("Generated Google Meet link:", meetingLink);
    }

    const [result] = await pool.execute(
      `INSERT INTO schedules 
       (groupId, title, description, start, end, location, attendees, googleEventId, meetingType, meetingLink)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [groupId, title, description, startISO, endISO, location, "[]", googleEvent.id, meetingType, meetingLink]
    );

    const newSchedule = {
      id: result.insertId,
      groupId: parseInt(groupId),
      title,
      description,
      start: startISO,
      end: endISO,
      location,
      attendees: [],
      googleEventId: googleEvent.id,
      meetingType,
      meetingLink
    };

    // Emit to group except sender
    const io = req.app.get("io");
    io.to(`group_${groupId}`).except(req.socket.id).emit("new_schedule", newSchedule);

    res.status(201).json({ success: true, schedule: newSchedule });

  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to create event", error: err.message });
  }
};

export const generateMeetLink = async (req, res) => {
  try {
    const googleEvent = await createEvent({
      title: "Temporary Meeting",
      description: "Auto-generated",
      location: "Online",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // +30 minutes
      meetingType: "online" // ensures Meet link is generated
    });

    // hangoutLink is the actual Google Meet URL
    res.json({ meetingLink: googleEvent.hangoutLink || null });
  } catch (err) {
    console.error("Failed to generate Google Meet link:", err);
    res.status(500).json({ message: "Failed to generate Google Meet link" });
  }
};


