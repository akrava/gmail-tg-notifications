import https from "https";
import { FindUserById } from "@controller/user";
import { checkUser } from "@telegram/common";
import { Middleware } from "telegraf";
import { google } from "googleapis";
import { authorizeUser, generateUrlToGetToken, getNewToken, IAuthObject } from "@gmail/index";
import Stage from "telegraf/stage";
import Scene, { SceneContextMessageUpdate } from "telegraf/scenes/base";

const gmailConnectScene = new Scene("connect_gmail");
gmailConnectScene.enter(async (ctx) => {
    const user = await FindUserById(ctx.chat.id);
    if (!user) {
        ctx.reply("Error ocurred");
        Stage.leave();
        return;
    }
    const obj = await authorizeUser(user.telegramID);
    if (obj !== null) {
        if (obj.authorized) {
            ctx.reply("Successfully authorized and connected");
            Stage.leave();
        } else {
            ctx.reply(
                "You need to authorize at gmail. Visit next link to get token." +
                "To cancel tap /cancel"
            );
            const url = generateUrlToGetToken(obj.oauth);
            ctx.reply(url);
            ctx.reply("Enter token:");
            ctx.scene.session.state = obj;
        }
    } else {
        ctx.reply("Error ocurred");
        return Stage.leave();
    }
});
gmailConnectScene.leave((ctx) => ctx.reply("Gmail config finished"));
gmailConnectScene.on("message", async (ctx) => {
    const user = await FindUserById(ctx.chat.id);
    if (!user) {
        ctx.reply("Error ocurred");
        return Stage.leave();
    }
    const obj = ctx.scene.session.state as IAuthObject;
    const auth = await getNewToken(ctx.chat.id, obj.oauth, ctx.message.text);
    if (auth === null) {
        ctx.reply("Error ocurred, bad token");
        return Stage.leave();
    } else {
        ctx.reply("Successfully authorized");
        const gmail = google.gmail({ version: "v1", auth });
        const res = await gmail.users.watch({
            userId: "me",
            requestBody: { topicName: process.env.PUB_SUB_TOPIC }
        });
        console.log(res);
        if (res.status !== 200) {
            ctx.reply("Error ocurred, couldn't subscribe");
            return Stage.leave();
        }
        const utcSeconds = Number.parseInt(res.data.expiration, 10);
        const date = new Date(0);
        date.setUTCSeconds(utcSeconds);
        console.log(date);
        // const cronPath = `https://www.easycron.com/rest/add?token=${process.env.UPDATE_PUB_SUB_TOPIC_PATH}&cron_expression=* * * * *`;
        // https.get(cronPath, (resp) => {
        //     let data = '';

        //     // A chunk of data has been recieved.
        //     resp.on('data', (chunk) => {
        //         data += chunk;
        //     });

        //     // The whole response has been received. Print out the result.
        //     resp.on('end', () => {
        //         console.log(JSON.parse(data).explanation);
        //     });

        // }).on("error", (err) => {
        //     console.log("Error: " + err.message);
        // });
        return Stage.leave();
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
