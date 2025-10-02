import { Types } from "mongoose"

export interface IChat {
  _id: Types.ObjectId,
  participants: Types.ObjectId[],
  lastMessage: Types.ObjectId
}