import { Context, MiddlewareFn } from "telegraf";
import { DeleteCredentials } from "@controller/user";
import { checkUser, BotCommand } from "@telegram/common";
import { authorizeUser, stopNotifications } from "@gmail/index";


const deleteToken: MiddlewareFn<Context> = async function(ctx) {
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
        await ctx.reply("successfully deleted token");
    } else {
        await ctx.reply("error ocurred");
    }
};

export const desrciption: BotCommand = {
    command: "delete_token",
    description: "Unsubscribe from email updates and delete Gmail token"
};

export default deleteToken;
