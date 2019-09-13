import https from "https";
import { FindUserById } from "@controller/user";
import { checkUser } from "@telegram/common";
import { Middleware } from "telegraf";
import { google } from "googleapis";
import { error } from "@service/logging";
import { authorizeUser, generateUrlToGetToken, getNewToken, IAuthObject } from "@gmail/index";
import Stage from "telegraf/stage";
import Scene, { SceneContextMessageUpdate } from "telegraf/scenes/base";
import { OAuth2Client } from "google-auth-library";

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
            ctx.reply("");
            ctx.reply("Successfully authorized from cache");
            if ((await watchMails(obj.oauth))) {
                await ctx.reply("Subscribed for new emails successfully");
                return ctx.scene.leave();
            } else {
                await ctx.reply("Error ocurred, couldn't subscribe");
                return ctx.scene.leave();
            }
        } else {
            const url = generateUrlToGetToken(obj.oauth);
            ctx.reply("");
            ctx.reply("You need to authorize at gmail. Open link below to get token. To cancel tap /cancel");
            ctx.reply(url);
            ctx.reply("Enter token:");
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
        if ((await watchMails(auth))) {
            await ctx.reply("Subscribed for new emails successfully");
            return ctx.scene.leave();
        } else {
            await ctx.reply("Error ocurred, couldn't subscribe");
            return ctx.scene.leave();
        }
    }
});

async function watchMails(auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });
    let res;
    try {
        res = await gmail.users.watch({
            userId: "me",
            requestBody: { topicName: process.env.PUB_SUB_TOPIC }
        });
    } catch (e) {
        console.error(res);
        error(e);
        return false;
    }
    console.log(res);
    if (res.status !== 200) {
        return false;
    }
    const utcSeconds = Number.parseInt(res.data.expiration, 10);
    const date = new Date(0);
    date.setUTCSeconds(utcSeconds);
    console.log(date);
    return true;
}

export const stage = new Stage([gmailConnectScene]);
stage.command("cancel", Stage.leave());

const connectGmail: Middleware<SceneContextMessageUpdate> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user !== false) {
        ctx.scene.enter("connect_gmail");
    }
};

export default connectGmail;
