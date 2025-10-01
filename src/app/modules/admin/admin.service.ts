import { AdminRepository } from "./admin.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { IPaginationOptions } from "../../../types/pagination";
import { USER_ROLES, VERIFICATION_STATUS } from "../../../enums/user";
import { BOOKING_STATUS } from "../../../enums/booking";
import { ICategory } from "../category/category.interface";
import { ITermsAndPolicy } from "../terms&policy/terms&policy.interface";

export class AdminService {
  private adminRepo: AdminRepository;

  constructor() {
    this.adminRepo = new AdminRepository();
  }

  public async overview() {
    return {
      totalAdmins: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalProducts: 0,
    };
  }

  public async getUsers(query: IPaginationOptions & { role: "user" | "provider" | "all" }) {
    return await this.adminRepo.getUsers(query, "name _id contact address role category");
  }

  public async getUser(id: string ) {
    const result = await this.adminRepo.getUser(new Types.ObjectId(id));
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }
    if (result.role == USER_ROLES.CLIENT) {
      return {
        name: result.name,
        image: result.image,
        category: result.category,
        gender: result.gender,
        dateOfBirth: result.dateOfBirth,
        nationality: result.nationality,
        email: result.email,
        whatsapp: result.whatsApp,
        contact: result.contact,
        address: result.address,
      }
    } else if (result.role == USER_ROLES.PROVIDER) {

      const completedWork = await this.adminRepo.countBookings({ provider: result._id, bookingStatus: BOOKING_STATUS.COMPLETED });
      const upCommingWork = await this.adminRepo.countBookings({ provider: result._id, bookingStatus: BOOKING_STATUS.ACCEPTED });
      const cancelWork = await this.adminRepo.countBookings({ provider: result._id, bookingStatus: BOOKING_STATUS.CANCELLED });

      const verificationFile = await this.adminRepo.getVerifications({ user: result._id, status: VERIFICATION_STATUS.APPROVED });

      return {
        name: result.name,
        image: result.image,
        category: result.category,
        gender: result.gender,
        dateOfBirth: result.dateOfBirth,
        nationality: result.nationality,
        email: result.email,
        whatsapp: result.whatsApp,
        contact: result.contact,
        address: result.address,

        // 
        completedWork: completedWork,
        upCommingWork: upCommingWork,
        cancelWork: cancelWork,
        
        //
        experience: result.experience,
        totalDoneWork: completedWork,
        review: 0,
        
        //
        expertise: result.category,
        country: result.nationality,
        serviceArea: result.address, // wignting for this to be changed
        serviceDistance: result.distance,
        availableTime: {
          startTime: result.startTime?? "",
          endTime: result.endTime?? ""
        },
        availableDay: result.availableDay,
        overview: result.overView,

        //
        licenses: verificationFile?.length > 0 ? [verificationFile[0].license, verificationFile[0].nid] : [],
        
      }
    }
  }

  public async addNewCategory(category: ICategory) {
    if (!category.image) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category name is required");
    }
    if( category.subCategory?.length > 0 ) {
      category.subCategory = [];
    }
    return await this.adminRepo.addNewCategory(category);
  }

  public async getCategories(query: IPaginationOptions & { id: string }) {

    const result = await this.adminRepo.getCategories(query, "name image subCategory");

    if (query.id) {
      if (result.length === 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
      }
      return result[0];
    }
    
    return result;
  }

  public async updateCategory(id: string, category: ICategory) {
    const result = await this.adminRepo.updateCategory(new Types.ObjectId(id), category);
    if (!result) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
    }
    return result;
  }

  public async deleteCategory(id: string) {
    const result = await this.adminRepo.deleteCategory(new Types.ObjectId(id));
    if (!result) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
    }
    return result;
  }
  
  public async getTerms() {
    return await this.adminRepo.getTerms();
  }

  public async getPolicy() {
    return await this.adminRepo.getPolicy();
  }

  public async upsertPolicy(policy: Partial<ITermsAndPolicy>) {
    // Try to find existing policy
    const existing = await this.adminRepo.getPolicy();
  
    if (!existing) {
      // Create new one if not exists
      return await this.adminRepo.addNewPolicy(policy as ITermsAndPolicy);
    }
  
    // Update existing one
    return await this.adminRepo.updatePolicy({
      content: policy.content ?? existing.content,
    } as ITermsAndPolicy);
  }
  
  public async upsertTerms(terms: Partial<ITermsAndPolicy>) {
    // Try to find existing terms
    const existing = await this.adminRepo.getTerms();
  
    if (!existing) {
      // Create new one if not exists
      return await this.adminRepo.addNewTerms(terms as ITermsAndPolicy);
    }
  
    // Update existing one
    return await this.adminRepo.updateTerms({
      _id: existing._id,
      content: terms.content ?? existing.content,
    } as ITermsAndPolicy);
  }
}
