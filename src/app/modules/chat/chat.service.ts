import { ChatRepository } from "./chat.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../user/user.model";
import { IPaginationOptions } from "../../../types/pagination";

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

  public async allChats (payload: JwtPayload, query: Partial<IPaginationOptions>){

    const allChats = await this.chatRepo.findAll( new Types.ObjectId(payload.id), query);

    return allChats.map( c => ({...c, participants: c.participants.filter( u => u._id != payload.id )}));

  }

  public async deleteOneChat (payload: JwtPayload, id: string){

    const chat = await this.chatRepo.findById(new Types.ObjectId(id));
    if (!chat) throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found!");

    const isParticipant = chat.participants.some((participant) => participant._id.toString() === payload.id);
    if (!isParticipant) throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not a participant of this chat!");

    return await this.chatRepo.delete(new Types.ObjectId(id));
  }

  public async findChat (payload: JwtPayload, name: string ){
    
    const user = await User.find({
      name: { $regex: name, $options: "i" }
    }).select("_id name image");

    console.log({name, user})

    if (user.length < 1) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    return user
  }

}
