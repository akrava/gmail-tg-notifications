import Express, { Request, Response, NextFunction } from "express";
import { bot } from "@telegram/index";
import { error } from "@service/logging"
import { router as gmailRouter } from "@gmail/index";

export const app = Express();

app.use(bot.webhookCallback(process.env.WEBHOOK_TG_PATH));

app.use(gmailRouter);

app.get(`/${process.env.GOOGLE_SITE_VERIFICATION}.html`, (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`google-site-verification: ${process.env.GOOGLE_SITE_VERIFICATION}.html`);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    console.trace();
    res.status(500);
});
