import Express from "express";
import { bot } from "@telegram/index";
import { router as gmailRouter } from "@gmail/index";

export const app = Express();

app.use(bot.webhookCallback(process.env.WEBHOOK_TG_PATH));

app.use(Express.static("assets/secure"));
app.use(Express.static("assets"));
app.use(gmailRouter);
