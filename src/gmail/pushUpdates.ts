import Express, { Application } from "express";
import bodyParser from "body-parser";
// import mongoSanitize from "express-mongo-sanitize";
import { OAuth2Client } from "google-auth-library";
import { error, info } from "@service/logging";
import { getEmails, IMailObject, authorizeUser, watchMails } from "@gmail/index";
import { FindUserByEmail, FindAll, SetChatsId } from "@controller/user";
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
    // const emailAddress = (mongoSanitize.sanitize(obj.emailAddress) as string)
    //     .toLowerCase().trim();
    const emailAddress = (obj.emailAddress as string)
        .toLowerCase().trim();
    // const historyId = mongoSanitize.sanitize(obj.historyId);
    const historyId = obj.historyId;
    const app = req.app;
    if (!addGmailUserWithHistoryId(app, emailAddress, historyId)) {
        info("This update was skipped due to it has been already processed");
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
                    continue;
                } else {
                    if (x.message.length > 3500) {
                        // TODO send several messages
                        x.message = x.message.substr(0, 3500);
                        x.message = x.message + "\nMessage exceed max length";
                    }
                    try {
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
                    } catch (err) {
                        try {
                            try {
                                const temp = await bot.telegram.getChat(chatId);
                                const botID = (await bot.telegram.getMe()).id;
                                let needToDel = false;
                                if (temp.type !== "private") {
                                    needToDel = true;
                                    const admins = await bot.telegram.getChatAdministrators(chatId);
                                    const isUserAdmin = admins.some((y) => y.user.id === user.telegramID);
                                    const isBotAdmin = admins.some((y) => y.user.id === botID);
                                    if (isBotAdmin && isUserAdmin) {
                                        needToDel = false;
                                    }
                                }
                            } catch (e) {
                                await SetChatsId(user.telegramID, user.chatsId.filter(i => i != chatId));
                                console.log("deleted chatID");
                            }
                        } catch (e) {
                            console.log("error while deleting caht id");
                        }
                        console.log("error with sending, deleted chat id");
                        // console.log(err);
                    }
                }
            }
        }
    }
    res.status(204).send();
    cleanGmailHistoryIdMap(app);
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
        setValue(app, emailHistoryIdMapKey, new Map<string, number>());
    }
    const current = email + histryId.toString();
    const curTime =  new Date().getTime();
    const mapGmailUserWithHistoryId = getValue<Map<string, number>>(app, emailHistoryIdMapKey);
    if (mapGmailUserWithHistoryId.has(current)) {
        return false;
    } else {
        mapGmailUserWithHistoryId.set(current, curTime);
        return true;
    }
}

function cleanGmailHistoryIdMap(app: Application) {
    if (isValueSet(app, emailHistoryIdMapKey)) {
        const map = getValue<Map<string, number>>(app, emailHistoryIdMapKey);
        if (map.size > 25) {
            const keysToDelete = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
            keysToDelete.forEach(x => map.delete(x[0]));
        }
    }
}
