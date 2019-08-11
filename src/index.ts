import { bot as TelegramBot } from "@telegram/index";
import { app as ServerApp } from "@server/index";
import { error, info } from "@service/logging";
import Mongoose from "mongoose";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

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
    .then(() => TelegramBot.launch())
    .catch((err) => error("tg", err));
