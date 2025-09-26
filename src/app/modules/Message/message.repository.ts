import { PopulateOptions, Types } from "mongoose";
import { IMessage } from "./message.interface";
import { Message } from "./message.model";
import { IPaginationOptions } from "../../../types/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";


export class MessageRepository {

    async create(data: Partial<IMessage>){
        return Message.create(data);
    }

    async findMany(
        {
          filter,
          select,
          populate,
          paginationOptions
        } : { 
          filter: Partial<IMessage>; 
          select?: string; 
          populate?: PopulateOptions; 
          paginationOptions?: IPaginationOptions 
        }
      ): Promise<IMessage[] | []> {
        let query = Message.find(filter);
    
        // Only populate if defined
        if (populate) {
          query = query.populate(populate);
        }
    
        // Only select if defined
        if (select) {
          query = query.select(select);
        }
    
        // Apply pagination if provided
        if (paginationOptions) {
          const { skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);
    
          query = query
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
        }
    
        return query.lean().exec();
    }

    async updateOne(query: Partial<IMessage>, data: Partial<IMessage>) {
        return Message.updateOne(query, data).lean().exec();
    }

    async deleteOne(query: Partial<IMessage>) {
        return Message.deleteOne(query).lean().exec();
    }
}