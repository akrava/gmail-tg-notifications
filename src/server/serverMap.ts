import { Application } from "express";

export function setValue<TVal>(app: Application, key: string, value: TVal) {
    app.set(key, value);
}

export function getValue<TVal>(app: Application, key: string): TVal {
    return app.get(key);
}

export function isValueSet(app: Application, key: string) {
    return typeof app.get(key) === "undefined";
}
