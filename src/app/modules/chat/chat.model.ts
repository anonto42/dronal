import { Schema, model } from "mongoose";
import { IChat } from "./chat.interface";

const chatSchema = new Schema<IChat>({
  participants:{
    type: [Schema.Types.ObjectId],
    ref: "User"
  },
  lastMessage:{
    type: Schema.Types.ObjectId,
    ref: "Message"
  }
}, { timestamps: true });

export const Chat = model<IChat>("Chat", chatSchema);
