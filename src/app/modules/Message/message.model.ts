import { model, Schema } from "mongoose";
import { IMessage } from "./message.interface";

const messageSchema = new Schema<IMessage>({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: "Chat"
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    image: {
        type: String
    },
    message: {
        type: String
    },
    isSeen: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    versionKey: false
});

export const Message = model<IMessage>("Message", messageSchema);