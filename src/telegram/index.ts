import Telegraf from "telegraf";
import { error } from "@service/logging";
import startCb from "@commands/start";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(startCb);

bot.catch((err: Error) =>  error(err));
