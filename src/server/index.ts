import Express from "express";
import { bot } from "@telegram/index";
import { router as gmailRouter } from "@gmail/index";

export const app = Express();

app.use(bot.webhookCallback(process.env.WEBHOOK_TG_PATH));

app.use(gmailRouter);

app.get(`/${process.env.GOOGLE_SITE_VERIFICATION}.html`, (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`google-site-verification: ${process.env.GOOGLE_SITE_VERIFICATION}.html`);
});
