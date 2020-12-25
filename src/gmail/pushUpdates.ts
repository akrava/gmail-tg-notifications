import Express, { Application } from "express";
import bodyParser from "body-parser";
import mongoSanitize from "express-mongo-sanitize";
import { OAuth2Client } from "google-auth-library";
import { error, info } from "@service/logging";
import { getEmails, IMailObject, authorizeUser, watchMails } from "@gmail/index";
import { FindUserByEmail, FindAll } from "@controller/user";
import { bot } from "@telegram/index";
import { getValue, setValue, isValueSet } from "@server/serverMap";

const jsonBodyParser = bodyParser.json();
const authClient = new OAuth2Client();
export const router = Express.Router();

router.post(process.env.GAPPS_PUSH_PATH, jsonBodyParser, async (req, res) => {
    try {
        const bearer = req.header("Authorization");
        const [, token] = bearer.match(/Bearer (.*)/);
        await authClient.verifyIdToken({
            idToken: token,
            audience: process.env.SERVER_PATH.replace(/https?:\/\/|\//g, ""),
        });
    } catch (e) {
        error(e);
        res.status(400).send("Invalid token");
        return;
    }
    const message = Buffer.from(req.body.message.data, "base64").toString("utf-8");
    const obj = JSON.parse(message);
    const emailAddress = mongoSanitize.sanitize(obj.emailAddress);
    const historyId = mongoSanitize.sanitize(obj.historyId);
    const app = req.app;
    if (!addGmailUserWithHistoryId(app, emailAddress, historyId)) {
        res.status(204).send();
        return;
    }
    const user = await FindUserByEmail(emailAddress);
    if (user) {
        let response: false | IMailObject[];
        try {
            response = await getEmails(emailAddress, historyId);
            if (response === false) {
                throw new Error();
            }
        } catch (e) {
            error(e);
            res.status(204).send();
            return;
        }
        for (const chatId of user.chatsId) {
            for (const x of response) {
                if (!x.message) {
                    error(new Error("empty message"));
                } else {
                    const sent = await bot.telegram.sendMessage(
                        chatId,
                        x.message,
                        { disable_web_page_preview: true }
                    );
                    x.attachments.forEach((y) => {
                        bot.telegram.sendDocument(
                            chatId,
                            { filename: y.name, source: y.data },
                            { reply_to_message_id: sent.message_id }
                        );
                    });
                }
            }
        }
    }
    res.status(204).send();
    removeGmailUserWithHistoryId(app, emailAddress, historyId);
});

router.get(process.env.UPDATE_PUB_SUB_TOPIC_PATH, async (_req, res) => {
    const users = await FindAll();
    if (!Array.isArray(users)) {
        res.status(204).send();
        return;
    }
    for (const user of users) {
        const obj = await authorizeUser(user.telegramID);
        const tgId = user.telegramID.toString();
        if (obj !== null) {
            if (obj.authorized) {
                if (!(await watchMails(user.telegramID, obj.oauth))) {
                    error(new Error("couldn't watch mails"));
                    bot.telegram.sendMessage(tgId, "Try to renew gmail subscription");
                } else {
                    info(`Successfully update subscription for ${tgId}`);
                }
            } else {
                error(new Error("bad token, not authorized"));
                bot.telegram.sendMessage(tgId, "Renew gmail subscription");
            }
        }
    }
    res.status(204).send();
});


const emailHistoryIdMapKey = "emailHistoryIdMap";

function addGmailUserWithHistoryId(app: Application, email: string, histryId: number) {
    if (!isValueSet(app, emailHistoryIdMapKey)) {
        setValue(app, emailHistoryIdMapKey, new Set<string>());
        for (let i = 0; i < 100; i++) {
            if (isValueSet(app, emailHistoryIdMapKey)) {
                break;
            }
            console.log(getValue<Set<string>>(app, emailHistoryIdMapKey));
        }
    }
    const current = email + histryId.toString();
    const mapGmailUserWithHistoryId = getValue<Set<string>>(app, emailHistoryIdMapKey);
    if (mapGmailUserWithHistoryId.has(current)) {
        return false;
    } else {
        mapGmailUserWithHistoryId.add(current);
        return true;
    }
}

function removeGmailUserWithHistoryId(app: Application, email: string, histryId: number) {
    if (isValueSet(app, emailHistoryIdMapKey)) {
        const current = email + histryId.toString();
        getValue<Set<string>>(app, emailHistoryIdMapKey).delete(current);
    }
}
