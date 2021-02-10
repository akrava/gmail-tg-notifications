import { FindUserById, SetEmail } from "@controller/user";
import { checkUser } from "@telegram/common";
import { Middleware, Scenes, Context } from "telegraf";
import { authorizeUser, generateUrlToGetToken, getNewToken, IAuthObject } from "@gmail/index";
import { getEmailAdress, watchMails } from "@gmail/index";
import { BotCommand } from "telegraf/typings/telegram-types";

const gmailConnectScene = new Scenes.BaseScene<Scenes.SceneContext>("connect_gmail");
gmailConnectScene.enter(async (ctx) => {
    const user = await FindUserById(ctx.chat.id);
    if (!user) {
        ctx.reply("Error ocurred");
        return ctx.scene.leave();
    }
    const obj = await authorizeUser(user.telegramID);
    if (obj !== null) {
        if (obj.authorized) {
            // ctx.reply("");
            await ctx.reply("Successfully authorized from cache");
            if ((await watchMails(user.telegramID, obj.oauth))) {
                await ctx.reply("Subscribed for new emails successfully");
                return ctx.scene.leave();
            } else {
                await ctx.reply("Error ocurred, couldn't subscribe");
                return ctx.scene.leave();
            }
        } else {
            const url = generateUrlToGetToken(obj.oauth);
            // ctx.reply("");
            await ctx.reply("You need to authorize at gmail. Open link below to get token. To cancel tap /cancel");
            await ctx.reply(url);
            await ctx.reply("Enter token:");
            ctx.scene.session.state = obj;
        }
    } else {
        ctx.reply("Error ocurred");
        return ctx.scene.leave();
    }
});
gmailConnectScene.leave((ctx) => ctx.reply("Gmail config finished"));
gmailConnectScene.on("text", async (ctx) => {
    const user = await FindUserById(ctx.chat.id);
    if (!user) {
        ctx.reply("Error ocurred");
        return ctx.scene.leave();
    }
    const obj = ctx.scene.session.state as IAuthObject;
    const auth = await getNewToken(ctx.chat.id, obj.oauth, ctx.message.text);
    if (auth === null) {
        ctx.reply("Error ocurred, bad token");
        return ctx.scene.leave();
    } else {
        await ctx.reply("Successfully authorized");
        const email = await getEmailAdress(auth);
        if (!email || !(await SetEmail(user.telegramID, email))) {
            await ctx.reply("Error ocurred, couldn't subscribe");
            return ctx.scene.leave();
        }
        if ((await watchMails(user.telegramID, auth))) {
            await ctx.reply("Subscribed for new emails successfully");
            return ctx.scene.leave();
        } else {
            await ctx.reply("Error ocurred, couldn't subscribe");
            return ctx.scene.leave();
        }
    }
});
gmailConnectScene.command("cancel", Scenes.Stage.leave<Scenes.SceneContext>());

export const stage = new Scenes.Stage<Scenes.SceneContext>([gmailConnectScene]);

const connectGmail: Middleware<Context> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user !== false) {
        Scenes.Stage.enter<Scenes.SceneContext>("connect_gmail");
    }
};

export const desrciption: BotCommand = {
    command: "connect_gmail",
    description: "Subscribe to watch new emails"
};

export default connectGmail;
