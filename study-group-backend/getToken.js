import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const CREDENTIALS_PATH = path.join("./credentials.json");
const TOKEN_PATH = path.join("./token.json");

function getAuthClient() {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const { client_secret, client_id, redirect_uris } = JSON.parse(content).installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  console.log("Authorize this app by visiting this URL:\n", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
      console.log("✅ Token stored to", TOKEN_PATH);
    });
  });
}

const auth = getAuthClient();
getAccessToken(auth);
