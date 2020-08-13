import { FindUserById, SetEmail } from "@controller/user";
import { checkUser } from "@telegram/common";
import { Middleware } from "telegraf";
import { authorizeUser, generateUrlToGetToken, getNewToken, IAuthObject } from "@gmail/index";
import Stage from "telegraf/stage";
import Scene, { SceneContextMessageUpdate } from "telegraf/scenes/base";
import { getEmailAdress, watchMails } from "@gmail/index";

const gmailConnectScene = new Scene("connect_gmail");
gmailConnectScene.enter(async (ctx) => {
    const user = await FindUserById(ctx.chat.id);
    if (!user) {
        ctx.reply("Error ocurred");
        return ctx.scene.leave();
    }
    const obj = await authorizeUser(user.telegramID);
    if (obj !== null) {
        if (obj.authorized) {
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
            await ctx.reply("You need to authorize at gmail. Open link below to get token. To cancel tap /cancel");
            ctx.reply(url);
            await ctx.reply("Enter token:");
            ctx.scene.session.state = obj;
        }
    } else {
        ctx.reply("Error ocurred");
        return ctx.scene.leave();
    }
});
gmailConnectScene.leave((ctx) => ctx.reply("Gmail config finished"));
gmailConnectScene.on("message", async (ctx) => {
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
        ctx.reply("Successfully authorized");
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

export const stage = new Stage([gmailConnectScene]);
stage.command("cancel", Stage.leave());

const connectGmail: Middleware<SceneContextMessageUpdate> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user !== false) {
        ctx.scene.enter("connect_gmail");
    }
};

export default connectGmail;
