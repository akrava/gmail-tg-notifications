import User, { IUser } from "@model/user";
import { error } from "@service/logging";

export interface ICreateUserInput {
    telegramID: IUser["telegramID"];
    chatsId?: IUser["chatsId"];
    token?: IUser["token"];
    email: IUser["email"];
    historyId?: IUser["historyId"];
    senderEmailToFilter?: IUser["senderEmailToFilter"];
}

export async function CreateUser(obj: ICreateUserInput) {
    return User.create({
            telegramID: obj.telegramID,
            chatsId: obj.chatsId,
            token: obj.token,
            email: obj.email,
            historyId: obj.historyId,
            senderEmailToFilter: obj.senderEmailToFilter
        })
        .then((data: IUser) => {
            return data;
        })
        .catch((e: Error) => {
            error(e);
        });
}

export async function FindUserById(tgId: IUser["telegramID"]) {
    return User.findOne({ telegramID: tgId })
        .then((data: IUser) => {
            return data || false;
        })
        .catch((e: Error) => {
            error(e);
        });
}

export async function FindAll() {
    return User.find({}).then((x) => x).catch((e) => (error(e), false));
}

export async function FindUserByEmail(email: IUser["email"]) {
    return User.findOne({ email })
        .then((data: IUser) => {
            return data || false;
        })
        .catch((e: Error) => {
            error(e);
        });
}

export async function SetChatsId(tgId: IUser["telegramID"], chatsId: IUser["chatsId"]) {
    return User.findOneAndUpdate({ telegramID: tgId }, { $set: { chatsId } }, { upsert: true })
        .then(() => true).catch((e) => (error(e), false));
}

export async function SetToken(tgId: IUser["telegramID"], token: IUser["token"]) {
    return User.findOneAndUpdate({ telegramID: tgId }, { $set: { token } }, { upsert: true })
        .then(() => true).catch((e) => (error(e), false));
}

export async function SetHistoryId(tgId: IUser["telegramID"], hId: IUser["historyId"]) {
    return User.findOneAndUpdate({ telegramID: tgId }, { $set: { historyId: hId } }, { upsert: true })
        .then(() => true).catch((e) => (error(e), false));
}

export async function SetEmail(tgId: IUser["telegramID"], email: IUser["email"]) {
    return User.findOneAndUpdate({ telegramID: tgId }, { $set: { email } }, { upsert: true })
        .then(() => true).catch((e) => (error(e), false));
}

export async function SetSenderEmailToFilter(tgId: IUser["telegramID"], senderEmailToFilter: IUser["senderEmailToFilter"]) {
    return User.findOneAndUpdate({ telegramID: tgId }, { $set: { senderEmailToFilter } }, { upsert: true })
        .then(() => true).catch((e) => (error(e), false));
}

export async function DeleteCredentials(tgId: IUser["telegramID"]) {
    return User.findOneAndUpdate({ telegramID: tgId }, { $set: {token: " ", historyId: 0} }, { upsert: true })
        .then(() => true).catch((e) => (error(e), false));
}

export async function DeleteUser(tgId: IUser["telegramID"]) {
    return User.deleteOne({ telegramID: tgId })
        .then((res) => {
            return res.ok === 1;
        })
        .catch((e: Error) => {
            error(e);
            return false;
        });
}
