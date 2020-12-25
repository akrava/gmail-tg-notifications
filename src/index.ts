import dotenv from "dotenv";
dotenv.config();
import { bot as TelegramBot } from "@telegram/index";
import { app as ServerApp } from "@server/index";
import { error, info } from "@service/logging";
import Mongoose from "mongoose";
import url from "url";

const connectionsOptions = {
    useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true
};

const SERVER_PATH = process.env.SERVER_PATH;
const WEBHOOK_TG_PATH = process.env.WEBHOOK_TG_PATH;
const PORT = process.env.PORT;
const completeWebhookTgPath = url.resolve(SERVER_PATH, WEBHOOK_TG_PATH);

Mongoose.connect(process.env.DB_URL, connectionsOptions)
    .catch(err => err ? error(err) : info("Opened connection with db"))
    .then(() => ServerApp.listen(PORT, () => info(`Running on port ${PORT}`)))
    .then(() => TelegramBot.telegram.setWebhook(completeWebhookTgPath))
    .then(res => res ? info("Tg bot started") : error(new Error("webhook error")))
    .catch(err => error(err));
