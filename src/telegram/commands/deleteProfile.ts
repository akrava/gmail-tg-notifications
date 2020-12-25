import { Context, Middleware } from "telegraf";
import { DeleteUser } from "@controller/user";
import { checkUser } from "@telegram/common";
import { BotCommand } from "telegraf/typings/telegram-types";


const deleteProfile: Middleware<Context> = async function(ctx) {
    console.log("test");
    const user = await checkUser(ctx);
    if (user === false) {
        return;
    }

    if ((await DeleteUser(user.telegramID))) {
        ctx.reply("successfully deleted user from db");
    } else {
        ctx.reply("error ocurred");
    }
};

export const desrciption: BotCommand = {
    command: "delete_profile",
    description: "Delete your profile with creds from bot"
};

export default deleteProfile;
