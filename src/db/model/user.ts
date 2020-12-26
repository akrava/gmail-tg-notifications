import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IUser extends Document {
    telegramID: number;
    chatsId: number[];
    token: string;
    email: string;
    historyId: number;
    senderEmailsToFilter?: string[];
}

const UserSchema: Schema = new Schema({
    telegramID:           { type: Number,   required: true,  unique: true  },
    chatsId:              { type: [Number], required: true,  default: []   },
    token:                { type: String,   required: true,  default: " "  },
    email:                { type: String,   required: true,  unique: true  },
    historyId:            { type: Number,   required: true,  default: 0    },
    senderEmailsToFilter: { type: [String], required: false, default: null }
});

export default mongoose.model<IUser>("User", UserSchema);
