import { Chat } from "./chat.model";
import { IChat } from "./chat.interface";
import { Types } from "mongoose";
import { Message } from "../Message/message.model";
import { IPaginationOptions } from "../../../types/pagination";

export class ChatRepository {
  
  async findById(id: Types.ObjectId) {
    return Chat.findById(id).select("-createdAt -updatedAt -__v").populate("participants","name image").lean().exec();
  }

  async create(user1: string, user2: string) {
    const chat = await Chat.findOne({ participants: [new Types.ObjectId(user1), new Types.ObjectId(user2)] }).lean().exec();
    if (chat) return chat;
    return Chat.create({ participants: [user1, user2] });
  }

  async update(id: Types.ObjectId, payload: Partial<IChat>) {
    return Chat.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async delete(id: Types.ObjectId) {
    const chat = await Chat.findByIdAndDelete(id).lean().exec();
    if (chat) {
      await Message.deleteMany({ chatId: chat._id });
    }
    return chat;
  }

  async findAll(id: Types.ObjectId, paginate: IPaginationOptions) {
  const page = paginate.page ?? 1;
  const limit = paginate.limit ?? 10;

  const sortBy = paginate.sortBy ?? 'createdAt'; 
  const sortOrder = paginate.sortOrder === 'desc' ? -1 : 1; 

  return Chat
    .find({ participants: id })
    .populate("participants", "name image")  
    .populate({
      path: "lastMessage",
      select: "sender message isSeen createdAt", 
      populate: {
        path: "sender",
        select: "name image"
      }
    })
    .limit(limit) 
    .skip((page - 1) * limit)
    .sort({ [sortBy]: sortOrder }) 
    .select("-createdAt -updatedAt -__v")  
    .lean()
    .exec();
  }

}
