import { Types } from "mongoose"

export interface IService {
    _id: Types.ObjectId,
    creator: Types.ObjectId,
    image: string,
    category: string,
    subCategory: string,
    price: number,
    isDeleted: boolean
}