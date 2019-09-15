import Express from "express";
import bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";
import { error } from "@service/logging";
import { getEmails, IMailObject } from "@gmail/index";
import { FindUserByEmail } from "@controller/user";
import { bot } from "@telegram/index";

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
    const user = await FindUserByEmail(obj.emailAddress);
    if (user) {
        let response: false | IMailObject[];
        try {
            response = await getEmails(obj.emailAddress, obj.historyId);
            if (response === false) {
                throw new Error();
            }
        } catch (e) {
            error(e);
            res.status(204).send();
            return;
        }
        for (const chatId of user.chatsId) {
            response.forEach((x) => {
                if (!x.message) {
                    error(new Error("empty message"));
                } else {
                    bot.telegram.sendMessage(chatId, x.message);
                    x.attachments.forEach((y) => {
                        bot.telegram.sendDocument(chatId, { filename: y.name, source: y.data });
                    });
                }
            });
        }
    }
    res.status(204).send();
});
