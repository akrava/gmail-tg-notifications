import User, { IUser } from "@model/user";
import { error } from "@service/logging";

export interface ICreateUserInput {
    id: IUser["id"];
    firstName: IUser["firstName"];
    chatsId: IUser["chatsId"];
}

export async function CreateUser({ id, firstName, chatsId }: ICreateUserInput) {
  return User.create({ id, firstName, chatsId })
    .then((data: IUser) => {
        return data;
    })
    .catch((e: Error) => {
        error("db", e);
    });
}

export async function FindUserById(id: IUser["id"]) {
    return User.findOne({ id })
        .then((data: IUser) => {
            return data || false;
        })
        .catch((e: Error) => {
            error("db", e);
        });
}
