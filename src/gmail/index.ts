import { FindUserById, SetToken, FindUserByEmail, SetHistoryId } from "@controller/user";
import { OAuth2Client } from "google-auth-library";
import Express from "express";
import { google, gmail_v1 } from "googleapis";
import { router as pushUpdatesRouter } from "@gmail/pushUpdates";
import { error } from "@service/logging";
import { GaxiosPromise } from "gaxios";
import htmlToText from "html-to-text";
import { toFormatedString } from "@service/date";
import { IUser } from "@model/user";

export const router = Express.Router();

router.use(pushUpdatesRouter);

const SCOPES = [ "https://www.googleapis.com/auth/gmail.readonly" ];

export interface IAuthObject { oauth: OAuth2Client; authorized: boolean; }

export interface IMailObject { message: string; attachments: IAttachmentObject[]; }

export interface IAttachmentObject { name: string; data: Buffer; }

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

export async function getEmailAdress(auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });
    let res;
    try {
        res = await gmail.users.getProfile({ userId: "me" });
    } catch (e) {
        error(e);
        return false;
    }
    if (res.status !== 200) {
        return false;
    }
    return res.data.emailAddress;
}

export async function stopNotifications(auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });
    let res;
    try {
        res = await gmail.users.stop({
            userId: "me"
        });
    } catch (e) {
        error(e);
        return false;
    }
    console.log(res);
    if (res.status !== 200 && res.status !== 204) {
        return false;
    }
    return true;
}

export async function watchMails(tgId: IUser["telegramID"], auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });
    let res;
    try {
        res = await gmail.users.watch({
            userId: "me",
            requestBody: {
                topicName: process.env.PUB_SUB_TOPIC,
                labelIds: ["INBOX"]
            }
        });
    } catch (e) {
        error(e);
        return false;
    }
    console.log(res);
    if (res.status !== 200) {
        return false;
    }
    const utcMs = Number.parseInt(res.data.expiration, 10);
    const date = new Date(utcMs);
    console.log(date);
    const hId = Number.parseInt(res.data.historyId, 10);
    if (!(await SetHistoryId(tgId, hId))) {
        return false;
    }
    return true;
}

export async function getEmails(emailAdress: string, historyId: number): Promise<false | IMailObject[]> {
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
    const emailsId: string[] = [];
    for (const r of res) {
        if (r.messagesAdded) {
            r.messagesAdded.forEach((mail) => {
                emailsId.push(mail.message.id);
            });
        }
    }
    const messagesDocuments = await retriveEmailsFromIds(gmail, emailsId);
    if (!messagesDocuments) {
        return false;
    }
    const result = [];
    for (const mail of messagesDocuments) {
        let message = "";
        if (mail.payload.parts) {
            let data = mail.payload.parts.filter((x) => x.mimeType.includes("text/html"));
            if (data.length === 0) {
                for (const part of mail.payload.parts) {
                    if (part.parts) {
                        data = data.concat(part.parts.filter((x) => x.mimeType.includes("text/html")));
                    }
                }
            }
            message = data.reduce((prev, cur) => prev += base64ToString(cur.body.data), "");
            message = htmlToText.fromString(message);

            // TODO 
            if (message.trim().length === 0) {
                let data = mail.payload.parts.filter((x) => x.headers && x.headers.filter(x => x.name && x.name.includes("Content-Type") && x.value && x.value.includes("text/html")).length > 0);
                if (data.length === 0) {
                    for (const part of mail.payload.parts) {
                        if (part.parts) {
                            data = data.concat(part.parts.filter((x) => x.headers && x.headers.filter(x => x.name && x.name.includes("Content-Type") && x.value && x.value.includes("text/html")).length > 0));
                        }
                    }
                }
                message = data.reduce((prev, cur) => prev += base64ToString(cur.body.data), ""); //
                message = htmlToText.fromString(message); //
            }
            // TODO 
        } else if (mail.payload.body) {
            message = htmlToText.fromString(base64ToString(mail.payload.body.data || ""));
        }
        if (mail.payload.headers) {
            const date = mail.payload.headers.filter((x) => x.name === "Date");
            const from = mail.payload.headers.filter((x) => x.name === "From");
            const subject = mail.payload.headers.filter((x) => x.name === "Subject");
            if (subject[0]) {
                message = `Subject: ${subject[0].value}\n\n\n\n` + message;
            }
            if (date[0]) {
                const dateVal = new Date(date[0].value);
                message = `Date: ${toFormatedString(dateVal)}\n` + message;
            }
            if (from[0]) {
                const fromValue = from[0].value.toLowerCase();
                if (fromValue.includes(emailAdress) || shouldSkipEmailFromThisSender(fromValue, user)) {
                    continue;
                }
                message = `From: ${fromValue}\n` + message;
            }
        }
        const attachments: IAttachmentObject[] = [];
        if (mail.payload && mail.payload.parts) {
            for (const part of mail.payload.parts) {
                if (part.filename) {
                    if (part.body.data) {
                        const data = Buffer.from(part.body.data, "base64");
                        attachments.push({ name: part.filename, data });
                    } else {
                        const attId = part.body.attachmentId;
                        const attachment = await retriveAttachment(gmail, mail.id, attId);
                        if (!attachment) {
                            return false;
                        }
                        const data = Buffer.from(attachment.data, "base64");
                        attachments.push({ name: part.filename, data });
                    }
                }
            }
        }
        result.push({ message, attachments });
    }
    if (!(await SetHistoryId(user.telegramID, historyId))) {
        return false;
    }
    return result;
}

function base64ToString(x: string) {
    if (typeof x !== "string") {
        return "";
    }
    return Buffer.from(x, "base64").toString("utf-8");
}

async function retriveAttachment(gmail: gmail_v1.Gmail, messageId: string, attId: string) {
    let resp;
    try {
        resp = await gmail.users.messages.attachments.get({ userId: "me", messageId, id: attId });
        if (resp.status !== 200) {
            throw new Error(resp.statusText);
        }
    } catch (e) {
        error(e);
        return false;
    }
    return resp.data;
}

async function retriveEmailsFromIds(gmail: gmail_v1.Gmail, arr: string[]) {
    const result = [];
    for (const id of arr) {
        let resp;
        try {
            resp = await gmail.users.messages.get({ userId: "me", id, format: "FULL" });
        } catch (e) {
            error(e);
            continue;
        }
        if (resp.status === 404) {
            continue;
        } else if (resp.status !== 200) {
            console.log(resp.status);
            error(new Error(resp.statusText));
            continue;
        }
        result.push(resp.data);
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
                    "labelId": "INBOX",
                    "startHistoryId": startHistoryId.toString(),
                    "pageToken": nextPageToken
                });
                getPageOfHistory(request, result);
            } else {
                callback(result, null);
            }
        }).catch(err => {
            console.error(`Error in listen history callback: ${err}`);
            callback(null, new Error(err));
        });
    };
    const req = gmail.users.history.list({
        "userId": "me",
        "labelId": "INBOX",
        "startHistoryId": startHistoryId.toString()
    });
    getPageOfHistory(req, []);
}

function shouldSkipEmailFromThisSender(valueWithSenderEmailAddress: string, currentTgUser: IUser) {
    if (typeof currentTgUser.filterActionIsBlock === "boolean" && Array.isArray(currentTgUser.senderEmailsToFilter)) {
        if (currentTgUser.filterActionIsBlock) {
            return currentTgUser.senderEmailsToFilter.some(x => valueWithSenderEmailAddress.includes(x));
        } else {
            return currentTgUser.senderEmailsToFilter.every(x => !valueWithSenderEmailAddress.includes(x));
        }
    }
    return false;
} 
