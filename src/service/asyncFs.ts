import fs from "fs";
import { error } from "@service/logging";

export function readFileAsync(fileName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}

export function writeFileAsync(fileName: string, data: string) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, data, (err) => {
            if (err) {
                error(err);
            }
            err ? reject(err) : resolve();
        });
    });
}

export function fileExistAsync(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            err ? resolve(false) : resolve(true);
        });
    });
}
