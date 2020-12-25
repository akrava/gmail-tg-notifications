import { Context } from "telegraf";
import { MiddlewareFn } from "telegraf/typings/composer"
import { DeleteUser } from "@controller/user";
import { checkUser } from "@telegram/common";
import { BotCommand } from "telegraf/typings/telegram-types";


const deleteProfile: MiddlewareFn<Context> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user === false) {
        return;
    }

    if ((await DeleteUser(user.telegramID))) {
        await ctx.reply("successfully deleted user from db");
    } else {
        await ctx.reply("error ocurred");
    }
};

export const desrciption: BotCommand = {
    command: "delete_profile",
    description: "Delete your profile with creds"
};

export default deleteProfile;
