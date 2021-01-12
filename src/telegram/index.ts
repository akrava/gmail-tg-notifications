import Telegraf from "telegraf";
import { error } from "@service/logging";
import session from "telegraf/session";
import startCb, { desrciption as startCommand } from "@commands/start";
import connectGmailCb, { desrciption as connectGmailCommand } from "@commands/connectGmail";
import setChatsId, { desrciption as setChatsIdCommand } from "@commands/setChatsId";
import getId, { desrciption as getIdCommand } from "@commands/getId";
import help, { desrciption as helpCommand } from "@commands/help";
import deleteTokenCb, { desrciption as deleteTokenCommand } from "@commands/deleteToken";
import deleteProfileCb, { desrciption as deleteProfileCommand } from "@commands/deleteProfile";
import filterEmailsCb , { desrciption as filterEmailsCommand } from "@commands/filterEmails";
import { stage as authGmailStage } from "@commands/connectGmail";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use(authGmailStage.middleware());
bot.start(startCb);
bot.command(connectGmailCommand.command, connectGmailCb);
bot.command(setChatsIdCommand.command, setChatsId);
bot.command(getIdCommand.command, getId);
bot.command(deleteTokenCommand.command, deleteTokenCb);
bot.command(deleteProfileCommand.command, async (ctx) =>  {
    await deleteTokenCb(ctx, null);
    await deleteProfileCb(ctx, null);
});
bot.command(filterEmailsCommand.command, filterEmailsCb);
bot.help(help);

bot.telegram.setMyCommands([startCommand, connectGmailCommand, setChatsIdCommand, helpCommand,
    filterEmailsCommand, getIdCommand, deleteTokenCommand, deleteProfileCommand])
    .catch(e => error(e));

bot.catch((err: Error) => error(err));
