import { Context, MiddlewareFn } from "telegraf";
import { SetSenderEmailsToFilterAndAction } from "@controller/user";
import { checkUser } from "@telegram/common";
import { BotCommand } from "telegraf/typings/telegram-types";

const filterEmails: MiddlewareFn<Context> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user === false) {
        return;
    }
    if (!("text" in ctx.message)) {
        return;
    }
    const lines = ctx.message.text.split(/[\r\n]+/);
    switch(lines.length) {
        case 3: {
            const secondLine = lines[1];
            const thirdLine = lines[2];
            let isActionBlock;
            switch (secondLine) {
                case "allow": {
                    isActionBlock = false;
                } break;
                case "block": {
                    isActionBlock = true;
                } break;
                default: {
                    await ctx.reply("Expected `allow` or `block` on the second line.");
                    return;
                }
            }
            const emails = Array.from(thirdLine.match(/\S+/g)) || [];
            emails.map(x => x.toLowerCase());
            if ((await SetSenderEmailsToFilterAndAction(user.telegramID, emails, isActionBlock))) {
                await ctx.reply(
                    `Filter rule was successfully set to ` +
                    `${ isActionBlock ? "block" : "allow" } only emails from such senders:\n` +
                    `${emails.reduce((prev, cur) => (prev.toString() + cur.toString() + "\n"), "")}`
                );
            } else {
                await ctx.reply("Error ocurred");
            }
        } break;
        case 2: {
            if (lines[1].trim() === "no") {
                if ((await SetSenderEmailsToFilterAndAction(user.telegramID, null, null))) {
                    await ctx.reply("Successfully disabled all filters.");
                } else {
                    await ctx.reply("Error ocurred");
                }
            } else {
                await ctx.replyWithHTML(
                    "Expected <code>no</code> to disable filter. You should send such " +
                    `messsage to disable filtering: \n<code>${desrciption.command}\nno` +
                    "</code>\nNothing to do."
                );
            }
        } break;
        default: {
            await ctx.reply("Expected two or three lines. Refer /help to get more info.");
        }
    }
};

export const desrciption: BotCommand = {
    command: "filter_emails",
    description: "Set list of senders email addresses which should be filtered"
};

export default filterEmails;
