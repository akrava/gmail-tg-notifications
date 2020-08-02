import { Context } from "telegraf";
import { FindUserById } from "@controller/user";

export async function checkUser(ctx: Context) {
    if (ctx.chat.type !== "private") {
        ctx.reply("Use private chat.");
        return false;
    }
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
