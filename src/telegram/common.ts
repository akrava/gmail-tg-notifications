import { ContextMessageUpdate } from "telegraf";
import { FindUserById } from "@controller/user";

export async function checkUser(ctx: ContextMessageUpdate) {
    const user = await FindUserById(ctx.chat.id);
    if (user === false) {
        ctx.reply("You are not registered. /start to proceed");
        return false;
    } else if (typeof user === "undefined") {
        ctx.reply("Error ocurred, contact to maintainer");
        return false;
    } else {
        return user;
    }
}
