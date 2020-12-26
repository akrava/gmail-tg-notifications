import { Context, Middleware } from "telegraf";
import { BotCommand } from "telegraf/typings/telegram-types";

const help: Middleware<Context> = async function(ctx) {
    ctx.replyWithHTML(
        "Tap /start to get started.\n" +
        "Tap /connect_gmail to subcribe for new emails.\n" +
        "To forward emails from gmail into specific chats " +
        "or channels you should enter chats ID in such format:\n" +
        "<code>\n" +
        "/set_chats\n" +
        "xxxx xxxx xxxx xxxx\n" +
        "</code>\n" +
        "Use /filter_emails command to filter incoming mails from senders email " +
        "addressess.\nTo set filter rule to block only emails from specified " + 
        "senders you should type such message:\n" +
        "<code>\n" +
        "/filter_emails\n" +
        "block\n" +
        "john@example.com tom@simple.org" +
        "</code>\n" +
        "To set filter rule to allow only emails from specified " + 
        "senders you should type such message:\n" +
        "<code>\n" +
        "/filter_emails\n" +
        "allow\n" +
        "john@example.com tom@simple.org\n" +
        "</code>\n" +
        "Tap /delete_token to unsubscribe from gmail updates and delete creds.\n" +
        "Tap /delete_profile to unsubscribe, delete creds and profile from DB.\n" +
        "Chats or channels id you can get here: @userinfobot.\n" +
        "Tap /get_id to get id of group chat."
    );
};

export const desrciption: BotCommand = {
    command: "help",
    description: "How to use this bot"
};

export default help;
