// utils/googleCalendar.js — FINAL VERSION (NO MORE ERRORS)
import fs from "fs";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, "../credentials.json");
const TOKEN_PATH = path.join(__dirname, "../token.json");

const auth = async () => {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("token.json not found! Run OAuth flow first.");
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
};

export const createEvent = async ({ title, description = "", location = "Online", start, end, meetingType = "physical" }) => {
  const authClient = await auth();
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const event = {
    summary: title,
    description,
    location,
    start: {
      dateTime: start,
      timeZone: "Asia/Manila",
    },
    end: {
      dateTime: end,
      timeZone: "Asia/Manila",
    },
  };

  // If online meeting, add Google Meet request
  if (meetingType === "online") {
    event.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: meetingType === "online" ? 1 : 0, // must be 1 to generate Meet link
  });

  return response.data;
};