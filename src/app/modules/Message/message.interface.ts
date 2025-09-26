import { Types } from "mongoose";

export interface IMessage {
    _id: Types.ObjectId;
    chatId: Types.ObjectId;
    message: string;
    image: string;
    sender: Types.ObjectId;
    isSeen: boolean
}