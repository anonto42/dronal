import { Types } from "mongoose"
import { SERVICE_DAY } from "../../../enums/service"

export interface IService {
    _id: Types.ObjectId,
    user: Types.ObjectId,
    category: string,
    subCategory: string,
    price: number,
    distance: number,
    availableDay: SERVICE_DAY[],
    startTime: string,
    endTime: string
}