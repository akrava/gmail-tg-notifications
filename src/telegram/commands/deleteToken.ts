import { Context, Middleware } from "telegraf";
import { DeleteCredentials } from "@controller/user";
import { checkUser } from "@telegram/common";
import { authorizeUser, stopNotifications } from "@gmail/index";
import { BotCommand } from "telegraf/typings/telegram-types";


const deleteToken: Middleware<Context> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user === false) {
        return;
    }
    const obj = await authorizeUser(user.telegramID);
    if (obj !== null) {
        if (obj.authorized) {
            if (!(await stopNotifications(obj.oauth))) {
                await ctx.reply("error while stopping notifications");
            } else {
                await ctx.reply("Unsubscribed");
            }
        } else {
            await ctx.reply("Not authorized");
        }
    } else {
        await ctx.reply("Error ocurred: auth obj is null");
    }

    if ((await DeleteCredentials(user.telegramID))) {
        ctx.reply("successfully deleted token");
    } else {
        ctx.reply("error ocurred");
    }
};

export const desrciption: BotCommand = {
    command: "delete_token",
    description: "Stop watching your email and delete Gmail token"
};

export default deleteToken;
