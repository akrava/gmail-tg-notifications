export function error(where: string, e: Error) {
    console.error(log("Error", where, e.message));
}

export function warning(where: string, what: string) {
    console.warn(log("Warning", where, what));
}

export function success(where: string, what: string) {
    console.log(log("Success", where, what));
}

export function info(where: string, what: string) {
    console.info(log("Info", where, what));
}

function log(type: string, where: string, what: string) {
    return `[${new Date().toISOString()}]: ${type} in ${where} occured: ${what}`;
}
