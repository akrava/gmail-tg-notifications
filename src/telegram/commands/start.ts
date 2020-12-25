import { CreateUser, FindUserById } from "@controller/user";
import { Middleware, Context } from "telegraf";
import { BotCommand } from "telegraf/typings/telegram-types";

const start: Middleware<Context> = async function(ctx) {
    if (ctx.chat.type === "private") {
        const user = await FindUserById(ctx.chat.id);
        if (user === false) {
            const newUser = await CreateUser({ 
                telegramID: ctx.chat.id,
                email: ctx.chat.id.toString(),
                chatsId: [ctx.chat.id]
            });
            if (typeof newUser !== "undefined") {
                ctx.reply("Successfully registered. Now you can adjust it. /help to see more");
            } else {
                ctx.reply("Error ocurred while registering");
            }
        } else if (typeof user === "undefined") {
            ctx.reply("Error ocurred, contact to maintainer");
        } else {
            ctx.reply("You are registered");
        }
    } else {
        ctx.reply("To start using this service you should send command start in private chat");
    }
};

export const desrciption: BotCommand = {
    command: "start",
    description: "Start using this bot"
};

export default start;
