import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

import { bot as TelegramBot } from "@telegram/index";
import { app as ServerApp } from "@server/index";
import { error, info } from "@service/logging";
import Mongoose from "mongoose";
import url from "url";

const connectionsOptions = {
    useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false
};

Mongoose.connect(process.env.DB_URL, connectionsOptions)
    .catch((err) => error("db", err))
    .then(() => info("db", "Opened connection with db"))
    .then(() => ServerApp.listen(process.env.PORT, () => info(
        "server", `Running on port ${process.env.PORT}`
    )))
    .catch((err) => error("server", err))
    .then(() => TelegramBot.telegram.setWebhook(
        url.resolve(process.env.SERVER_PATH, process.env.WEBHOOK_TG_PATH
    )))
    .then((res) => res ? TelegramBot.launch() : error("tg", new Error("webhook error")))
    .catch((err) => error("tg", err));
