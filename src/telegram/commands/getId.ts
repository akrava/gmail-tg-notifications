import { ContextMessageUpdate, Middleware } from "telegraf";

const getId: Middleware<ContextMessageUpdate> = async function(ctx) {
    ctx.reply(ctx.chat.id.toString());
};

export default getId;
