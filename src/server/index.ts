import Express from "express";
import { bot } from "@telegram/index";
import path from "path";

export const app = Express();

app.use(bot.webhookCallback(process.env.WEBHOOK_TG_PATH));
bot.telegram.setWebhook(path.join(process.env.SERVER_PATH, process.env.WEBHOOK_TG_PATH));

app.use(Express.static("assets/secure"));
app.use(Express.static("assets"));

app.use((req, res) => {
    console.log("k");
    res.status(204).send();
});
