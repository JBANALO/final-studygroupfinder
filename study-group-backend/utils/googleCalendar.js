import fs from "fs";
import { google } from "googleapis";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CREDENTIALS_PATH = path.join("./credentials.json");

const auth = async () => {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // TODO: Load token from file or generate a new one
  const TOKEN_PATH = path.join("./token.json");
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
  } else {
    console.log("No token found, generate one via URL"); 
  }

  return oAuth2Client;
};

export const createEvent = async (event) => {
  const authClient = await auth();
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return res.data;
};
