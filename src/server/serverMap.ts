import { app } from "@server/index";

export function setValue<TVal>(key: string, value: TVal) {
    app.set(key, value);
}

export function getValue<TVal>(key: string): TVal {
    return app.get(key);
}

export function isValueSet(key: string) {
    return typeof app.get(key) === "undefined";
}
