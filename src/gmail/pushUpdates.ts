import Express from "express";
import bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";
import { error, info } from "@service/logging";
import { getEmails, IMailObject, authorizeUser, watchMails } from "@gmail/index";
import { FindUserByEmail, FindAll } from "@controller/user";
import { bot } from "@telegram/index";

const jsonBodyParser = bodyParser.json();
const authClient = new OAuth2Client();
export const router = Express.Router();

router.post(process.env.GAPPS_PUSH_PATH, jsonBodyParser, async (req, res) => {
    res.send(500);
    // try {
    //     const bearer = req.header("Authorization");
    //     const [, token] = bearer.match(/Bearer (.*)/);
    //     await authClient.verifyIdToken({
    //         idToken: token,
    //         audience: process.env.SERVER_PATH.replace(/https?:\/\/|\//g, ""),
    //     });
    // } catch (e) {
    //     error(e);
    //     res.status(400).send("Invalid token");
    //     return;
    // }
    // const message = Buffer.from(req.body.message.data, "base64").toString("utf-8");
    // const obj = JSON.parse(message);
    // const user = await FindUserByEmail(obj.emailAddress);
    // if (user) {
    //     let response: false | IMailObject[];
    //     try {
    //         response = await getEmails(obj.emailAddress, obj.historyId);
    //         if (response === false) {
    //             throw new Error();
    //         }
    //     } catch (e) {
    //         error(e);
    //         res.status(204).send();
    //         return;
    //     }
    //     for (const chatId of user.chatsId) {
    //         for (const x of response) {
    //             if (!x.message) {
    //                 error(new Error("empty message"));
    //             } else {
    //                 const sent = await bot.telegram.sendMessage(
    //                     chatId,
    //                     x.message,
    //                     { disable_web_page_preview: true }
    //                 );
    //                 x.attachments.forEach((y) => {
    //                     bot.telegram.sendDocument(
    //                         chatId,
    //                         { filename: y.name, source: y.data },
    //                         { reply_to_message_id: sent.message_id }
    //                     );
    //                 });
    //             }
    //         }
    //     }
    // }
    // res.status(204).send();
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
