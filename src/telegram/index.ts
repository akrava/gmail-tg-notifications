import Telegraf from "telegraf";
import { error } from "@service/logging";
import session from "telegraf/session";
import startCb from "@commands/start";
import connectGmailCb, { desrciption as connectGmailCommand } from "@commands/connectGmail";
import setChatsId, { desrciption as setChatsIdCommand } from "@commands/setChatsId";
import getId, { desrciption as getIdCommand } from "@commands/getId";
import help, { desrciption as helpCommand } from "@commands/help";
import deleteTokenCb, { desrciption as deleteTokenCommand } from "@commands/deleteToken";
import deleteProfileCb, { desrciption as deleteProfileCommand } from "@commands/deleteProfile";
import { stage as authGmailStage } from "@commands/connectGmail";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use(authGmailStage.middleware());
bot.start(startCb);
bot.command(connectGmailCommand.command, connectGmailCb);
bot.command(setChatsIdCommand.command, setChatsId);
bot.command(getIdCommand.command, getId);
bot.command(deleteTokenCommand.command, deleteTokenCb);
bot.command(deleteProfileCommand.command, deleteTokenCb, deleteProfileCb);
bot.help(help);

bot.telegram.setMyCommands([connectGmailCommand, getIdCommand, setChatsIdCommand,
    deleteTokenCommand, helpCommand, deleteProfileCommand]);

bot.catch((err: Error) => error(err));
