import { AdminRepository } from "./admin.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { IPaginationOptions } from "../../../types/pagination";
import { STATUS, USER_ROLES, VERIFICATION_STATUS } from "../../../enums/user";
import { BOOKING_STATUS } from "../../../enums/booking";
import { ICategory } from "../category/category.interface";
import { ITermsAndPolicy } from "../terms&policy/terms&policy.interface";
import { Notification } from "../notification/notification.model";
import { emailQueue } from "../../../queues/email.queue";
import { redisDB } from "../../../redis/connectedUsers";
import { User } from "../user/user.model";
import { Verification } from "../verification/verification.model";
import { Support } from "../HelpAndSupport/support.model";

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
    return await this.adminRepo.getUsers(query, "name _id contact address role category status");
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

      const reviews = await this.adminRepo.getReviews({
        filter: { provider: result._id },
        select: "-updatedAt -__v -provider -service",
        populate: {
          path: "creator",
          select: "name image"
        }
      });

      let averageRating = 0;

      if (reviews.length > 0) {
        const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        averageRating = total / reviews.length;
      }

      const completedWork = await this.adminRepo.countBookings({ provider: result._id, bookingStatus: BOOKING_STATUS.COMPLETED });
      const upCommingWork = await this.adminRepo.countBookings({ provider: result._id, bookingStatus: BOOKING_STATUS.ACCEPTED });
      const cancelWork = await this.adminRepo.countBookings({ provider: result._id, bookingStatus: BOOKING_STATUS.CANCELLED });

      const verificationFile = await this.adminRepo.getVerifications({
        user: result._id, 
        // status: VERIFICATION_STATUS.APPROVED 
      });

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
        review: averageRating,
        
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

  public async blockAndUnblockUser(id: string, block: string) {
    const result = await this.adminRepo.updateUser(new Types.ObjectId(id), { 
      status: block == "block" ? STATUS.BLOCKED : block == "unblock" ? STATUS.ACTIVE : STATUS.BLOCKED 
    });
    if (!result) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "User not found");
    }

    return result.status;
  }

  public async getRequests(query: IPaginationOptions) {
    return await this.adminRepo.getRequests({
      filter: { status: VERIFICATION_STATUS.PENDING },
      select: "user status",
      populate: {
        path: "user",
        select: "name image category email contact nationalId"
      },
      paginationOptions: query
    });
  }

  public async approveOrReject(id: string, status: string) {
    if(status != "approve" && status != "reject") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status");
    }

    const resultverification = await this.adminRepo.getRequests({
      filter: { _id: new Types.ObjectId(id) }
    });
    if (!resultverification.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Request not found");
    }

    if (resultverification[0].status == VERIFICATION_STATUS.APPROVED || resultverification[0].status == VERIFICATION_STATUS.REJECTED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Request already ${resultverification[0].status}`);
    }

    const result = await this.adminRepo.updateRequests({
      _id: new Types.ObjectId(id)
    }, { 
      status: status == "approve" ? VERIFICATION_STATUS.APPROVED : status == "reject" ? VERIFICATION_STATUS.REJECTED : VERIFICATION_STATUS.PENDING 
    });
    if (!result) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Request not found");
    }

    // Have to add the notification
    const message = await Notification.create({
      for: resultverification[0].user,
      message: "Your verification request has been " + (status == "approve" ? "approved" : "rejected"),
    });
    
    await emailQueue.add("socket-notification", message, {
      removeOnComplete: true,
      removeOnFail: false,
    });
    
    const isProviderOnline = await redisDB.get(`user:${resultverification[0].user}`);
    if (!isProviderOnline) {
      const provider = await this.adminRepo.getUser(resultverification[0].user);
      await emailQueue.add("push-notification", {
        notification: {
          title: "Your verification request has been " + (status == "approve" ? "approved" : "rejected"),
          body: `Admin has ${status == "approve" ? "approved" : "rejected"} your verification request`
        },
        token: provider?.fcmToken
      }, {
        removeOnComplete: true,
        removeOnFail: false,
      });
    };

    return result.status;
  }
  
  public async find(query: IPaginationOptions & { search: string, compo: "user" | "verification" | "support" }) {
    const user = await User.find({
      name: { $regex: query.search, $options: "i" }
    }).select("name image category email contact nationalId").lean().exec();

    if (query.compo == "user") {
      return user;
    }

    if (query.compo == "verification") {
      return await Verification.find({
        user: { $in: user.map((user) => user._id) }
      }).select("user status").populate({
        path: "user",
        select: "name image category email contact nationalId"
      }).lean().exec();
    }

    if (query.compo == "support") {
      return await Support.find({
        user: { $in: user.map((user) => user._id) }
      })
      .select("user status title")
      .populate({
        path: "user",
        select: "name image category email contact nationalId"
      })
      .lean()
      .exec();
    }
  }
}
