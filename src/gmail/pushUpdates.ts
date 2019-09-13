import Express from "express";
import bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";
import { error } from "@service/logging";

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
    console.log("================", message, "================");

    res.status(204).send();
});
