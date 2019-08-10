import Telegraf from "telegraf";
import { error } from "@service/logging";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.catch((err: Error) => {
    error("tg bot", err);
});
