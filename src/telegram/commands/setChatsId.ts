import { bot } from "@telegram/index";
import { ContextMessageUpdate, Middleware } from "telegraf";
import { SetChatsId as SetChatsIdController } from "@controller/user";
import { checkUser } from "@telegram/common";
import { error } from "@service/logging";

const setChatsId: Middleware<ContextMessageUpdate> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user === false) {
        return;
    }
    const lines = ctx.message.text.split(/[\r\n]+/);
    if (lines.length !== 2) {
        ctx.reply("expected two lines");
        return;
    }
    lines.splice(0, 1);
    const data = lines[0].match(/\S+/g) || [];
    let chatsId;
    try {
        chatsId = data.map(Number);
        if (!chatsId.every((x) => Number.isInteger(x))) {
            throw new Error("not a numer");
        }
    } catch (e) {
        error(e);
        ctx.reply("not a number");
        return;
    }
    const botID = (await bot.telegram.getMe()).id;
    const chats: number[] = [];
    for (const x of chatsId) {
        let chat;
        try {
            chat = await bot.telegram.getChat(x);
        } catch (e) {
            continue;
        }
        if (chat.type !== "private") {
            const admins = await bot.telegram.getChatAdministrators(x);
            const isUserAdmin = admins.some((y) => y.user.id === user.telegramID);
            const isBotAdmin = admins.some((y) => y.user.id === botID);
            if (isBotAdmin && isUserAdmin) {
                chats.push(x);
            }
        } else {
            chats.push(x);
        }
    }
    if ((await SetChatsIdController(user.telegramID, chats))) {
        ctx.reply(chats.reduce((prev, cur) => (prev.toString() + cur.toString() + "\n"), ""));
    } else {
        ctx.reply("error ocurred");
    }
};

export default setChatsId;
