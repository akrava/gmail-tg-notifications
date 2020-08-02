// from https://github.com/mnb3000/telegraf
declare module "telegraf/stage" {
    import { Middleware, Composer } from "telegraf";
    import { MiddlewareFn } from 'telegraf/typings/composer'
    import Scene, { SceneContextOptions, SceneContextMessageUpdate } from "telegraf/scenes/base";
    
    export type StageOptions = SceneContextOptions;
    
    export default class Stage<TContext extends SceneContextMessageUpdate> extends Composer<TContext> {
        constructor(scenes: Scene<TContext>[], options?: Partial<StageOptions>)
    
        register: (...scenes: Scene<TContext>[]) => this;
    
        middleware: () => MiddlewareFn<TContext>;
    
        static enter: (sceneId: string, initialState?: object, silent?: boolean) => Middleware<SceneContextMessageUpdate>;
    
        static reenter: () => Middleware<SceneContextMessageUpdate>;
    
        static leave: () => Middleware<SceneContextMessageUpdate>;
    }

}
