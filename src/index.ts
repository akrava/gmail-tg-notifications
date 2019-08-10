import { bot as TelegramBot } from "@telegram/index";
import { error, info } from "@service/logging";
import Mongoose from "mongoose";

const connectionsOptions = {
    useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false
};

Mongoose.connect(process.env.DB_URL, connectionsOptions)
    .then(() => info("db", "Opened connection with db"))
    .then(() => TelegramBot.launch())
    .catch((err) => error("db", err));
