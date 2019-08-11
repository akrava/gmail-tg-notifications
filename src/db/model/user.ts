import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IUser extends Document {
    telegramID: number;
    gmailID: number;
    chatsId: number[];
    expire: Date;
}

const UserSchema: Schema = new Schema({
    telegramID: { type: Number,   required: true, unique: true               },
    gmailID:    { type: Number,   required: true, unique: true, default: NaN },
    chatsId:    { type: [Number], required: true, default: []                },
    expire:     { type: Date }
});

export default mongoose.model<IUser>("User", UserSchema);
