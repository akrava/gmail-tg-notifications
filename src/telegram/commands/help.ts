import { Context, Middleware } from "telegraf";
import { BotCommand } from "telegraf/typings/telegram-types";

const help: Middleware<Context> = async function(ctx) {
    ctx.replyWithHTML(
        "Tap /start to get started.\n\n" +
        "Tap /connect_gmail to subcribe for new emails.\n\n" +
        "To forward emails from gmail into specific chats " +
        "or channels you should enter /set_chats command and " +
        "list of chats ID separeted by whitespaces on second " +
        "line in such format :\n" +
        "<pre>" +
        "/set_chats\n" +
        "0000 0000 0000 0000" +
        "</pre>\n\n" +
        "Use /filter_emails command to filter incoming mails from senders email " +
        "addressess.\nTo set filter rule to block only emails from specified " + 
        "senders you should type such message, where on the second line there " +
        "should be <code>block</code> word and on the third line there should " +
        "be list of senders emails separeted by whitespaces. Example:\n" +
        "<pre>" +
        "/filter_emails\n" +
        "block\n" +
        "john@example.com tom@simple.org" +
        "</pre>\n" +
        "To set filter rule to allow only emails from specified senders you " + 
        "should type such message, where on the second line there should be " +
        "<code>allow</code> word and on the third line there should be list " +
        "of senders emails separeted by whitespaces. Example:\n" +
        "<pre>" +
        "/filter_emails\n" +
        "allow\n" +
        "john@example.com tom@simple.org" +
        "</pre>\n\n" +
        "Tap /delete_token to unsubscribe from gmail updates and delete creds.\n\n" +
        "Tap /delete_profile to unsubscribe, delete creds and profile from DB.\n\n" +
        "Chats or channels ID you can get here: @userinfobot.\n" +
        "Tap /get_id to get id of group chat."
    );
};

export const desrciption: BotCommand = {
    command: "help",
    description: "How to use this bot"
};

export default help;
