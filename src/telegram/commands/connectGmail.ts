import { CreateUser, FindUserById } from "@controller/user";
import { checkUser } from "@telegram/common";
import { ContextMessageUpdate, Middleware } from "telegraf";
import { authorizeUser, generateUrlToGetToken } from "@gmail/index";
import { Composer, Markup } from "telegraf";
import session from "telegraf/session";
import Stage from "telegraf/stage";
import WizardScene from "telegraf/scenes/wizard";

const connectGmail: Middleware<ContextMessageUpdate> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user !== false) {
        const obj = await authorizeUser(user.gmailID);
        if (obj !== null) {
            if (obj.authorized) {
                ctx.reply("successfully");
            } else {
                const url = generateUrlToGetToken(obj.oauth);
            }
        } else {
            ctx.reply("Error ocurred");
        }
    }
};

export default connectGmail;
