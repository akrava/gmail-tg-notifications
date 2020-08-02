// from https://github.com/mnb3000/telegraf
declare module "telegraf/session" {
    import { Middleware, Context } from "telegraf";
    
    export default function session<TContext extends Context>(opts?: Partial<{
        property: string;
        store: Map<string, any>;
        getSessionKey: (ctx: TContext) => string;
        ttl: number;
    }>): Middleware<TContext>;

}
