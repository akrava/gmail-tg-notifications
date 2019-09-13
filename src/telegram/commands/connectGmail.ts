import https from "https";
import { FindUserById, SetEmail, SetHistoryId } from "@controller/user";
import { checkUser } from "@telegram/common";
import { Middleware } from "telegraf";
import { google } from "googleapis";
import { error } from "@service/logging";
import { authorizeUser, generateUrlToGetToken, getNewToken, IAuthObject } from "@gmail/index";
import Stage from "telegraf/stage";
import Scene, { SceneContextMessageUpdate } from "telegraf/scenes/base";
import { OAuth2Client } from "google-auth-library";
import { IUser } from "@model/user";

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
            if ((await watchMails(user.telegramID, obj.oauth))) {
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
        const email = await getEmail(auth);
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

async function getEmail(auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });
    let res;
    try {
        res = await gmail.users.getProfile({ userId: "me" });
    } catch (e) {
        error(e);
        return false;
    }
    if (res.status !== 200) {
        return false;
    }
    return res.data.emailAddress;
}

async function watchMails(tgId: IUser["telegramID"], auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });
    let res;
    try {
        res = await gmail.users.watch({
            userId: "me",
            requestBody: { topicName: process.env.PUB_SUB_TOPIC }
        });
    } catch (e) {
        error(e);
        return false;
    }
    console.log(res);
    if (res.status !== 200) {
        return false;
    }
    const utcMs = Number.parseInt(res.data.expiration, 10);
    const date = new Date(utcMs);
    console.log(date);
    const hId = Number.parseInt(res.data.historyId, 10);
    if (!(await SetHistoryId(tgId, hId))) {
        return false;
    }
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
