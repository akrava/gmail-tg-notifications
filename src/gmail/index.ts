import path from "path";
import { FindUserById, SetToken, FindUserByEmail, SetHistoryId } from "@controller/user";
import { OAuth2Client } from "google-auth-library";
import Express from "express";
import { google, gmail_v1 } from "googleapis";
import { router as pushUpdatesRouter } from "@gmail/pushUpdates";
import { error } from "@service/logging";
import { GaxiosResponse, GaxiosPromise } from "gaxios";

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
        if (user.token === " ") {
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

export async function getEmails(emailAdress: string, historyId: number) {
    const user = await FindUserByEmail(emailAdress);
    if (!user) {
        return false;
    }
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    if (user.token === " ") {
        error(new Error("Bad token"));
        return false;
    }
    oAuth2Client.setCredentials(JSON.parse(user.token));
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    let res;
    try {
        res = await asyncListHistory(gmail, user.historyId);
    } catch (e) {
        error(e);
        return false;
    }
    const result: string[] = [];
    console.log("@@@@@@");
    console.log(res);
    console.log("@@@@@@");
    for (const r of res) {
        r.messagesAdded.forEach((mail) => result.push(mail.message.payload.body.data));
    }
    if (!(await SetHistoryId(user.telegramID, historyId))) {
        return false;
    }
    return result;
}

async function asyncListHistory(gmail: gmail_v1.Gmail, startHistoryId: number) {
    return new Promise<gmail_v1.Schema$History[]>((resolve, reject) => {
        listHistory(gmail, startHistoryId, (res, err) => err ? reject(err) : resolve(res));
    });
}

function listHistory(
    gmail: gmail_v1.Gmail,
    startHistoryId: number,
    callback: (res: gmail_v1.Schema$History[], err: Error) => void
) {
    const getPageOfHistory = function(
        request: GaxiosPromise<gmail_v1.Schema$ListHistoryResponse>,
        result: gmail_v1.Schema$History[]
    ) {
        request.then(function(resp) {
            if (resp.status !== 200) {
                callback(null, new Error(resp.statusText));
            }
            result = result.concat(resp.data.history || []);
            const nextPageToken = resp.data.nextPageToken;
            if (nextPageToken) {
                request = gmail.users.history.list({
                    "userId": "me",
                    "startHistoryId": startHistoryId.toString(),
                    "pageToken": nextPageToken
                });
                getPageOfHistory(request, result);
            } else {
                callback(result, null);
            }
        });
    };
    const req = gmail.users.history.list({
        "userId": "me",
        "startHistoryId": startHistoryId.toString()
    });
    getPageOfHistory(req, []);
}
