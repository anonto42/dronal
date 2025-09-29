
import { Types } from "mongoose";
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

export class AdminRepository {
  
  async getUsers(query: IPaginationOptions & { role: "user" | "provider" | "all" }, select?: string): Promise<IUser[]> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };
    
    if(query.role === "all") {
      return User.find({ role: { $ne: USER_ROLES.ADMIN } }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
    }else if(query.role === "user") {
      return User.find({ role: USER_ROLES.CLIENT }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
    }else if(query.role === "provider") {
      return User.find({ role: USER_ROLES.PROVIDER }).select(select??"").skip(skip).limit(limit).sort(sort).lean().exec();
    }
    
    return [] as IUser[];
  }

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
}