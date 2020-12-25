import Express, { Request, Response, NextFunction } from "express";
import { bot } from "@telegram/index";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { router as gmailRouter } from "@gmail/index";

export const app = Express();

app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.use(mongoSanitize());

console.log(bot);
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
