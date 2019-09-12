import { CreateUser, FindUserById } from "@controller/user";
import { checkUser } from "@telegram/common";
import { ContextMessageUpdate, Middleware } from "telegraf";
import { authorizeUser, generateUrlToGetToken } from "@gmail/index";
import { Composer, Markup } from "telegraf";
import Stage from "telegraf/stage";
// import WizardScene from "telegraf/scenes/wizard";

// const authGmail = new WizardScene("auth-gmail",
//     (ctx) => {
//         ctx.reply('Step 1', Markup.inlineKeyboard([
//             Markup.urlButton('❤️', 'http://telegraf.js.org'),
//             Markup.callbackButton('➡️ Next', 'next')
//         ]).extra())
//         return ctx.wizard.next()
//     },
//     stepHandler,
//     (ctx) => {
//         ctx.reply('Step 3')
//         return ctx.wizard.next()
//     },
//     (ctx) => {
//         ctx.reply('Step 4')
//         return ctx.wizard.next()
//     },
//     (ctx) => {
//         ctx.reply('Done')
//         return ctx.scene.leave()
//     }
// );

// export const stage = new Stage([authGmail], { default: "auth-gmail" });

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
