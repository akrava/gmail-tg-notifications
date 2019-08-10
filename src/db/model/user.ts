import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IUser extends Document {
    id: number;
    firstName: string;
    chatsId: number[];
}

const UserSchema: Schema = new Schema({
    id: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    chatsId: { type: [Number], required: true }
});

export default mongoose.model<IUser>("User", UserSchema);
