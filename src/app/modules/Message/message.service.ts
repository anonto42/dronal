import { JwtPayload } from "jsonwebtoken";
import { IPaginationOptions } from "../../../types/pagination";
import { MessageRepository } from "./message.repository";
import { IMessage } from "./message.interface";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { emailQueue } from "../../../queues/email.queue";
import { IUser } from "../user/user.interface";
import { ProviderRepository } from "../provider/provider.repository";
import { redisDB } from "../../../redis/connectedUsers";
import { Chat } from "../chat/chat.model";

export class MessageService {
    private messageRepository: MessageRepository;
    private providerRepo: ProviderRepository;

    constructor() {
        this.messageRepository = new MessageRepository();
        this.providerRepo = new ProviderRepository();
    }

    public async create(user: JwtPayload, payload: Partial<IMessage>) {
        
        if( !payload.message && !payload.image ){
            throw new ApiError(
                StatusCodes.NOT_ACCEPTABLE,
                "You must give at last one message"
            )
        } 

        const chat = await this.messageRepository.findChat({ _id: new Types.ObjectId(payload.chatId) });
        if (!chat) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Chat not found"
            )
        }

        payload.sender = new Types.ObjectId(user.id);
        const message = await this.messageRepository.create(payload);

        await this.messageRepository.updateChat({ _id: new Types.ObjectId(payload.chatId) }, { lastMessage : new Types.ObjectId(message._id) });

        const isCustomerOnline = await redisDB.get(`user:${user.id}`);
        if (!isCustomerOnline) {
          const chat = await Chat.findById(new Types.ObjectId(message.chatId))
          const customer = await this.providerRepo.findById(new Types.ObjectId( chat?.participants.find((participant) => participant._id.toString() !== user.id) )) as IUser;
          await emailQueue.add("push-notification", {
            notification: {
              title: "Got message",
              body: "You have a new message"
            },
            token: customer?.fcmToken
          }, {
            removeOnComplete: true,
            removeOnFail: false,
          });
        }
        
        await emailQueue.add("socket-message", { message, chat },{
          removeOnComplete: true,
          removeOnFail: false,
        })
        
        return message;
    }

    public async updateMessage(user: JwtPayload, id: string, payload: Partial<IMessage>) {
        const result = await this.messageRepository.updateOne({ sender: new Types.ObjectId( user.id ), _id:  new Types.ObjectId( id ) }, payload)
        if(!result.modifiedCount) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Message not found"
            )
        }
        return result.modifiedCount;
    }

    public async messagesOfChat(user: JwtPayload, query: IPaginationOptions, chatId: string) {
        return await this.messageRepository.findMany({
            filter: { 
                chatId: new Types.ObjectId( chatId ), 
                // sender: new Types.ObjectId( user.id )
            },
            paginationOptions: query,
            populate: {
                path: "sender",
                select: "name image"
            },
            select: "-chatId"
        })
    }

    public async deleteMessage(user: JwtPayload, id: string) {
        const result = await this.messageRepository.deleteOne({ sender: new Types.ObjectId( user.id ), _id:  new Types.ObjectId( id ) })
        if(!result.deletedCount) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Message not found"
            )
        }
        return result;
    }
}