import { bot } from "@telegram/index";
import { CreateUser, FindUserById } from "@controller/user";

bot.start(async (ctx) => {
    if (ctx.chat.type === "private") {
        const user = await FindUserById(ctx.chat.id);
        if (user === false) {
            // TODO add more
            const newUser = await CreateUser({ id: ctx.chat.id, chatsId: [], firstName: "" });
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
});
