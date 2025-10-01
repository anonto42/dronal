import { Types } from "mongoose";


export interface ITermsAndPolicy {
    _id?: Types.ObjectId;
    type: "terms" | "policy";
    content: string;    
}