import Telegraf from "telegraf";
import { error } from "@service/logging";
import session from "telegraf/session";
import startCb from "@commands/start";
import connectGmailCb from "@commands/connectGmail";
// import { stage as authGmailStage } from "@commands/connectGmail";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
// bot.use(authGmailStage.middleware());
bot.start(startCb);
bot.command("connect_gmail", connectGmailCb);

bot.catch((err: Error) => error(err));
