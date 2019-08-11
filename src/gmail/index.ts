import Express from "express";
import bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";

const jsonBodyParser = bodyParser.json();
const authClient = new OAuth2Client();
export const router = Express.Router();

const messages = [];
const claims = [];
const tokens = [];

router.post(process.env.GAPPS_PUSH_PATH, jsonBodyParser, async (req, res) => {
    // Verify that the request originates from the application.
    if (req.query.token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
        res.status(204).send();
        //res.status(400).send("Invalid request");
        return;
    }
    console.log(req.query);
    console.log(req.query.token);
    // Verify that the push request originates from Cloud Pub/Sub.
    try {
        // Get the Cloud Pub/Sub-generated JWT in the "Authorization" header.
        const bearer = req.header("Authorization");
        const [, token] = bearer.match(/Bearer (.*)/);
        tokens.push(token);
        console.log(bearer);
        console.log(token);
        // Verify and decode the JWT.
        const ticket = await authClient.verifyIdToken({
            idToken: token,
            audience: process.env.SERVER_PATH.replace(/https?:\/\/|\//g, ""),
        });

        const claim = ticket.getPayload();
        claims.push(claim);
    } catch (e) {
        console.log(e);
        res.status(204).send();
        //res.status(400).send("Invalid token");
        return;
    }
    console.log(req.body);
    // The message is a unicode string encoded in base64.
    const message = Buffer.from(req.body.message.data, "base64").toString("utf-8");
    console.log(message);
    messages.push(message);

    res.status(204).send();
});

// import * as fs from "fs";
// import * as readline from "readline";
// import { google } from "googleapis";

// // If modifying these scopes, delete token.json.
// const SCOPES = [ "https://www.googleapis.com/auth/gmail.readonly" ];
// // The file token.json stores the user"s access and refresh tokens, and is
// // created automatically when the authorization flow completes for the first
// // time.
// const TOKEN_PATH = "token.json";

// // Load client secrets from a local file.
// fs.readFile("credentials.json", (err, content) => {
//     if (err) {
//         return console.log("Error loading client secret file:", err);
//     }
//     // Authorize a client with credentials, then call the Gmail API.
//     authorize(JSON.parse(content.toString()), listLabels);
// });

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials: object, callback: () => void) {
//     const { client_secret, client_id, redirect_uris } = credentials.installed;
//     const oAuth2Client = new google.auth.OAuth2(
//         client_id, client_secret, redirect_uris[0]);

//     // Check if we have previously stored a token.
//     fs.readFile(TOKEN_PATH, (err, token) => {
//         if (err) {
//             return getNewToken(oAuth2Client, callback);
//         }
//         oAuth2Client.setCredentials(JSON.parse(token.toString()));
//         callback(oAuth2Client);
//     });
// }

// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback for the authorized client.
//  */
// function getNewToken(oAuth2Client, callback) {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: SCOPES,
//   });
//   console.log("Authorize this app by visiting this url:", authUrl);
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   rl.question("Enter the code from that page here: ", (code) => {
//     rl.close();
//     oAuth2Client.getToken(code, (err, token) => {
//       if (err) return console.error("Error retrieving access token", err);
//       oAuth2Client.setCredentials(token);
//       // Store the token to disk for later program executions
//       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//         if (err) return console.error(err);
//         console.log("Token stored to", TOKEN_PATH);
//       });
//       callback(oAuth2Client);
//     });
//   });
// }

// /**
//  * Lists the labels in the user"s account.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function listLabels(auth) {
//   const gmail = google.gmail({version: "v1", auth});
//   gmail.users.labels.list({
//     userId: "me",
//   }, (err, res) => {
//     if (err) return console.log("The API returned an error: " + err);
//     const labels = res.data.labels;
//     if (labels.length) {
//       console.log("Labels:");
//       labels.forEach((label) => {
//         console.log(`- ${label.name}`);
//       });
//     } else {
//       console.log("No labels found.");
//     }
//   });
// }
