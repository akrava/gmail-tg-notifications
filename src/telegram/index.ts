import Telegraf from "telegraf";
import { error } from "@service/logging";
import startCb from "@commands/start";
import connectGmailCb from "@commands/connectGmail";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(startCb);
bot.command("connect_gmail", connectGmailCb);

bot.catch((err: Error) => error(err));
