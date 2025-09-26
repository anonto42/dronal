import { JwtPayload } from "jsonwebtoken";
import { IPaginationOptions } from "../../../types/pagination";
import { MessageRepository } from "./message.repository";
import { IMessage } from "./message.interface";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";


export class MessageService {
    private messageRepository: MessageRepository;

    constructor() {
        this.messageRepository = new MessageRepository();
    }

    public async create(user: JwtPayload, payload: Partial<IMessage>) {
        
        if( !payload.message && !payload.image ){
            throw new ApiError(
                StatusCodes.NOT_ACCEPTABLE,
                "You must give at last one message"
            )
        } 

        payload.sender = user.id;
        
        return this.messageRepository.create(payload);
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
            filter: { chatId: new Types.ObjectId( chatId ), sender: new Types.ObjectId( user.id )},
            paginationOptions: query,
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