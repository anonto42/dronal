import { ChatRepository } from "./chat.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export class ChatService {
  private chatRepo: ChatRepository;

  constructor() {
    this.chatRepo = new ChatRepository();
  }

  public async create(payload: JwtPayload ,data: { user: string }) {
    return this.chatRepo.create(payload.id, data.user);
  }

  public async getById(id: string, payload: JwtPayload) {
    const result = await this.chatRepo.findById(new Types.ObjectId(id));
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found!");

    return {
      _id: result._id,
      chatWith: result.participants.find((participant) => participant._id.toString() !== payload.id),
    };
  }

  public async allChats (payload: JwtPayload){

    const allChats = await this.chatRepo.findAll( new Types.ObjectId(payload.id))

    return allChats
  }

  public async deleteOneChat (payload: JwtPayload, id: string){

    const chat = await this.chatRepo.findById(new Types.ObjectId(id));
    if (!chat) throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found!");

    const isParticipant = chat.participants.some((participant) => participant._id.toString() === payload.id);
    if (!isParticipant) throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not a participant of this chat!");

    return await this.chatRepo.delete(new Types.ObjectId(id));
  }

}
