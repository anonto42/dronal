
import { PopulateOptions, Types } from "mongoose";
import { User } from "../user/user.model";
import { IUser } from "../user/user.interface";
import { Verification } from "../verification/verification.model";
import { IVerificaiton } from "../verification/verification.interface";
import { Service } from "../service/service.model";
import { IPaginationOptions } from "../../../types/pagination";
import { IService } from "../service/service.interface";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { STATUS } from "../../../enums/user";
import { IBooking } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { Category } from "../category/category.model";

export class ProviderRepository {

  async findById(
    id: Types.ObjectId,
    select?: string
  ) {
    
    let query = User.findById(id)
    
    if (select) {
      query = query.select(select)
    }

    return query.lean().exec(); 
  }

  async update(id: Types.ObjectId, payload: Partial<IUser>) {
    return User.findByIdAndUpdate(id, payload).lean().exec();
  }

  async delete(id: Types.ObjectId){
    return User.findByIdAndUpdate(id, { status: STATUS.DELETED }).lean().exec();
  }

  async viewVerification(user: Types.ObjectId){
    return Verification.findOne({
      user
    }).select("-updatedAt -user").lean().exec();
  }

  async createVerificationRequest(data: IVerificaiton){
    return Verification.create(data)
  }
  
  async updateVerificationRequest(id: Types.ObjectId, data: IVerificaiton){
    return Verification.findByIdAndUpdate(id, data, { new: true }).lean().exec()
  }

  async providerServices(
    {
      filter,
      select,
      populate,
      paginationOptions
    } : { 
      filter: Partial<IService>; 
      select?: string; 
      populate?: PopulateOptions; 
      paginationOptions?: IPaginationOptions 
    }
  ): Promise<IService[] | []> {
    let query = Service.find(filter);

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

  async addService(data: Partial<IService>){
    return Service.create(data)
  }

  async deleteService(id: Types.ObjectId){
    return Service.findByIdAndUpdate(id, { isDeleted: true }).lean().exec();
  }

  async updateService(id: Types.ObjectId, payload: Partial<IService>){
    return Service.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async findBookings (
    {
      filter,
      select,
      populate,
      paginationOptions
    } : { 
      filter: Partial<IBooking>; 
      select?: string; 
      populate?: PopulateOptions; 
      paginationOptions?: IPaginationOptions 
    }
  ): Promise<IBooking[] | []> {
    let query = Booking.find(filter);

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

  async updateBooking(id: Types.ObjectId, payload: Partial<IBooking>){
    return Booking.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async getCategories(query: IPaginationOptions) {
    const { page=1, limit=10, sortBy="createdAt", sortOrder="desc" } = query;
    return Category.find().select("-createdAt -updatedAt -__v -isDeleted").lean().skip((page - 1) * limit).limit(limit).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).exec();
  }
}
