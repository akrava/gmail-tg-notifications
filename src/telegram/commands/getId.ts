import { Context, Middleware } from "telegraf";

const getId: Middleware<Context> = async function(ctx) {
    ctx.reply(ctx.chat.id.toString());
};

export default getId;
