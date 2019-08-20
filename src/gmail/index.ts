import { OAuth2Client } from "google-auth-library";
import Express from "express";
import { google } from "googleapis";
import { router as pushUpdatesRouter } from "@gmail/pushUpdates";
import { error } from "@service/logging";
import { readFileAsync, fileExistAsync, writeFileAsync } from "@service/asyncFs";

export const router = Express.Router();

router.use(pushUpdatesRouter);

const SCOPES = [ "https://www.googleapis.com/auth/gmail.readonly" ];

export interface IAuthObject { oauth: OAuth2Client; authorized: boolean; }

export async function authorizeUser(userGmailId: number): Promise<IAuthObject | null> {
    let credentials;
    try {
        credentials = JSON.parse((await readFileAsync("secure/credentials.json")).toString());
    } catch (e) {
        error(e);
        return null;
    }
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const tokenPath = `secure/token${userGmailId}.json`;
    try {
        if (!fileExistAsync(tokenPath)) {
            return { oauth: oAuth2Client, authorized: false };
        } else {
            const token = (await readFileAsync(tokenPath)).toString();
            oAuth2Client.setCredentials(JSON.parse(token));
            return { oauth: oAuth2Client, authorized: true };
        }
    } catch (e) {
        error(e);
        return null;
    }
}

export function generateUrlToGetToken(oAuth2Client: OAuth2Client) {
    return oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
}

export async function getNewToken(
    userGmailId: number,
    oAuth2Client: OAuth2Client,
    code: string
): Promise<OAuth2Client | null> {
    return new Promise((resolve) => {
        oAuth2Client.getToken(code, async (err, token) => {
            if (err) {
                error(err);
                return resolve(null);
            }
            oAuth2Client.setCredentials(token);
            const tokenPath = `secure/token${userGmailId}.json`;
            try {
                await writeFileAsync(tokenPath, JSON.stringify(token));
                return oAuth2Client;
            } catch (err) {
                return null;
            }
        });
    });
}

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
