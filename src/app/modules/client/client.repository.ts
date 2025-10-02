import { paginationHelper } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../types/pagination';
import { CustomerFavorite } from '../favorites/customer.favorite.model';
import { IReview } from '../review/review.interface';
import { Review } from '../review/review.model';
import { IService } from '../service/service.interface';
import { Service } from '../service/service.model';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { PopulateOptions, Types } from 'mongoose';
import { IVerificaiton } from '../verification/verification.interface';
import { Verification } from '../verification/verification.model';
import { ICustomerFavorite } from '../favorites/customer.favorite.interface';
import { IBooking } from '../booking/booking.interface';
import { Booking } from '../booking/booking.model';
import { BOOKING_STATUS } from '../../../enums/booking';
import { Category } from '../category/category.model';
import { IPayment } from './../payment/payment.interface';
import { Payment } from '../payment/payment.model';

export class ClientRepository {

  async findById(id: Types.ObjectId,select?: string) {
    return User.findById(id).select(select?? "").lean().exec();
  }

  async findByEmail(email: string) {
    return User.findOne({ email }).lean().exec();
  }

  async create(payload: Partial<IUser>) {
    return User.create(payload);
  }

  async update(id: Types.ObjectId, payload: Partial<IUser>) {
    return User.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async isExistById(id: Types.ObjectId) {
    return User.exists({ _id: id });
  }

  async findMany(
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

  async isExistByEmail(email: string) {
    return User.exists({ email });
  }

  async addFavorite(user: Types.ObjectId, provider: Types.ObjectId) {
    const providerUser = await User.findById(provider).lean().exec();
    if (!providerUser) return providerUser;
    const isExistFavorite = await CustomerFavorite.findOne({ customer: user, provider: providerUser._id });
    if(isExistFavorite) return isExistFavorite;
    return CustomerFavorite.create({ customer: user, provider: providerUser._id });
  }

  async removeFavorite(id: Types.ObjectId) {
    return CustomerFavorite.findOneAndDelete({ provider: id }).lean().exec();
  }

  async getFavorites(query: Partial<ICustomerFavorite>,select?: string) {
    return CustomerFavorite.find(query).populate("provider",select?? "").select("provider").lean().exec();
  }

  async getReviews({
    filter,
    select,
    populate,
    paginationOptions
  }: {
    filter: Partial<IReview>;
    select?: string;
    populate?: PopulateOptions;
    paginationOptions?: IPaginationOptions;
  }) {
    
    let query = Review.find(filter);
    
    // Only select if defined
    if (select) {
      query = query.select(select);
    }
    
    // Only populate if defined
    if (populate) {
      query = query.populate(populate);
    }
    
    // Apply pagination if provided
    if (paginationOptions) {
      const { page, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);

      query = query
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
    }

    return query.lean().exec();
  }

  async getValidationRequests( query: Partial<IVerificaiton>,select?: string): Promise<IVerificaiton | null> {
    return Verification.findOne(query).populate("user",select?? "").lean().exec();
  }

  async createBooking(payload: Partial<IBooking>) {
    return Booking.create(payload);
  }

  async updateBooking(id: Types.ObjectId, payload: Partial<IBooking>) {
    return Booking.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async cancelBooking(id: Types.ObjectId) {
    return Booking.findByIdAndUpdate(id,{bookingStatus: BOOKING_STATUS.CANCELLED}, { new: true }).populate("service").lean().exec();
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

  async getCategories(query: IPaginationOptions) {
    const { page=1, limit=10, sortBy="createdAt", sortOrder="desc" } = query;
    return Category.find().select("-createdAt -updatedAt -__v -isDeleted").lean().skip((page - 1) * limit).limit(limit).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).exec();
  }

  async findAndUpdateProvider(id: Types.ObjectId, payload: Partial<IUser>) {
    return User.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async updatePayment({
    filter,
    payload
  }: {
    filter: Partial<IPayment>;
    payload: Partial<IPayment>;
  }) {
    return Payment.findOneAndUpdate(filter, payload, { new: true }).lean().exec();
  }

  async giveReview(payload: Partial<IReview>) {
    return Review.create(payload);
  }
}
