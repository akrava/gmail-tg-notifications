import path from "path";
import { FindUserById, SetToken } from "@controller/user";
import { OAuth2Client } from "google-auth-library";
import Express from "express";
import { google } from "googleapis";
import { router as pushUpdatesRouter } from "@gmail/pushUpdates";
import { error } from "@service/logging";

export const router = Express.Router();

router.use(pushUpdatesRouter);

const SCOPES = [ "https://www.googleapis.com/auth/gmail.readonly" ];

export interface IAuthObject { oauth: OAuth2Client; authorized: boolean; }

export async function authorizeUser(tgID: number): Promise<IAuthObject | null> {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const user = await FindUserById(tgID);
    if (!user) {
        return null;
    }
    try {
        if (user.token === "") {
            return { oauth: oAuth2Client, authorized: false };
        } else {
            oAuth2Client.setCredentials(JSON.parse(user.token));
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
    tgID: number,
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
            try {
                if (!(await SetToken(tgID, JSON.stringify(token)))) {
                    throw new Error("Couldn't write token");
                }
                resolve(oAuth2Client);
            } catch (err) {
                resolve(null);
            }
        });
    });
}
