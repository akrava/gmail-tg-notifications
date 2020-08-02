import { Context, Middleware } from "telegraf";

const help: Middleware<Context> = async function(ctx) {
    ctx.reply(
        "Tap /start to get started.\n" +
        "Tap /connect_gmail to subcribe for new emails.\n" +
        "Enter chats ID to send greetings in such format:\n" +
        "***\n" +
        "/set_chats\n" +
        "xxxx xxxx xxxx xxxx\n" +
        "***\n" +
        "Chats id you can get here: @userinfobot\n" +
        "/get_id to get id of group chat"
    );
};

export default help;
