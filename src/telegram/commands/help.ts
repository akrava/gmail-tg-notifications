import { Context, Middleware } from "telegraf";
import { BotCommand } from "telegraf/typings/telegram-types";

const help: Middleware<Context> = async function(ctx) {
    ctx.reply(
        "Tap /start to get started.\n" +
        "Tap /connect_gmail to subcribe for new emails.\n" +
        "Enter chats ID to send emails in such format:\n" +
        "***\n" +
        "/set_chats\n" +
        "xxxx xxxx xxxx xxxx\n" +
        "***\n" +
        "Tap /delete_token to delete token\n" +
        "Chats id you can get here: @userinfobot\n" +
        "/get_id to get id of group chat"
    );
};

export const desrciption: BotCommand = {
    command: "help",
    description: "How to use this bot"
};

export default help;
