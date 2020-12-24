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

Mongoose.connect(process.env.DB_URL, connectionsOptions)
    .catch((err) => err ? error(err) : info("Opened connection with db"))
    .then(() => ServerApp.listen(process.env.PORT, () => info(
        `Running on port ${process.env.PORT}`
    ))).then(() => TelegramBot.telegram.setWebhook(
        url.resolve(process.env.SERVER_PATH, process.env.WEBHOOK_TG_PATH
    ))).then((res) => res ? info("Tg bot started") : error(new Error("webhook error")))
    .catch((err) => error(err));
