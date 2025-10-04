
import { PopulateOptions, Types } from "mongoose";
import { USER_ROLES } from "../../../enums/user";
import { IPaginationOptions } from "../../../types/pagination";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { IBooking } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { IVerificaiton } from "../verification/verification.interface";
import { Verification } from "../verification/verification.model";
import { ICategory } from "../category/category.interface";
import { Category } from "../category/category.model";
import { ITermsAndPolicy } from "../terms&policy/terms&policy.interface";
import { TermsModel } from "../terms&policy/terms&policy.model";
import { IReview } from "../review/review.interface";
import { Review } from "../review/review.model";
import { paginationHelper } from "../../../helpers/paginationHelper";

export class AdminRepository {
  
  async getUsers(query: IPaginationOptions & { role: "user" | "provider" }, select?: string): Promise<IUser[]> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };
    
    if(!query.role) {
      return User.find({ role: { $ne: USER_ROLES.ADMIN } }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
    }else if(query.role === "user") {
      return User.find({ role: USER_ROLES.CLIENT }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
    }else if(query.role === "provider") {
      return User.find({ role: USER_ROLES.PROVIDER }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
    }
    
    return [] as IUser[];
  }

  async countUsers (){}

  async getUser(id: Types.ObjectId): Promise<IUser | null> {
    return User.findById(id).lean().exec();
  }

  async getBookings(query: Partial<IBooking>): Promise<IBooking[]> {
    return Booking.find(query).lean().exec();
  }

  async getBooking(id: Types.ObjectId): Promise<IBooking | null> {
    return Booking.findById(id).lean().exec();
  }

  async countBookings(query: Partial<IBooking>): Promise<number> {
    return Booking.countDocuments(query).exec();
  }

  async getVerifications(query: Partial<IVerificaiton>): Promise<IVerificaiton[]> {
    return Verification.find(query).lean().exec();
  }

  async addNewCategory(category: ICategory): Promise<ICategory> {
    return Category.create(category);
  }

  async getCategories(query: IPaginationOptions & { id: string }, select?: string): Promise<ICategory[]> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };
    return Category.find(query.id ? { _id: query.id, isDeleted: false } : { isDeleted: false }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
  }

  async updateCategory(id: Types.ObjectId, category: ICategory): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, category, { new: true }).lean().exec();
  }

  async deleteCategory(id: Types.ObjectId): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean().exec();
  }

  async addNewPolicy(policy: ITermsAndPolicy): Promise<ITermsAndPolicy> {
    return TermsModel.create({ type: "policy", content: policy.content });
  }
  
  async getPolicy(): Promise<ITermsAndPolicy | null> {
    return TermsModel.findOne({ type: "policy" })
      .select("content -_id")
      .lean()
      .exec();
  }
  
  async updatePolicy(policy: ITermsAndPolicy): Promise<ITermsAndPolicy | null> {
    return TermsModel.findOneAndUpdate(
      { type: "policy" },
      { content: policy.content },
      { new: true }
    )
      .select("content")
      .lean()
      .exec();
  }
  
  async addNewTerms(terms: ITermsAndPolicy): Promise<ITermsAndPolicy> {
    return TermsModel.create({ type: "terms", content: terms.content });
  }
  
  async getTerms(): Promise<ITermsAndPolicy | null> {
    return TermsModel.findOne({ type: "terms" })
      .select("content -_id")
      .lean()
      .exec();
  }
  
  async updateTerms(terms: ITermsAndPolicy): Promise<ITermsAndPolicy | null> {
    return TermsModel.findOneAndUpdate(
      { type: "terms" },
      { content: terms.content },
      { new: true }
    )
      .select("content")
      .lean()
      .exec();
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

  async updateUser(id: Types.ObjectId, payload: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async getRequests({
    filter,
    select,
    populate,
    paginationOptions
  }: {
    filter: Partial<IVerificaiton>;
    select?: string;
    populate?: PopulateOptions;
    paginationOptions?: IPaginationOptions;
  }) {
    
    let query = Verification.find(filter);
    
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

  async updateRequests(filter: Partial<IVerificaiton>, payload: Partial<IVerificaiton>): Promise<IVerificaiton | null> {
    return Verification.findOneAndUpdate(filter, payload, { new: true }).lean().exec();
  }
}