import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";

import ApiError from "../../../errors/ApiError";
import { buildPaginationResponse } from "../../../util/pagination";

import { IPaginationOptions } from "../../../types/pagination";
import { STATUS, USER_ROLES, VERIFICATION_STATUS } from "../../../enums/user";
import { BOOKING_STATUS } from "../../../enums/booking";
import { PAYMENT_STATUS } from "../../../enums/payment";

import { ITermsAndPolicy } from "../terms&policy/terms&policy.interface";
import { ICategory } from "../category/category.interface";

import { User } from "../user/user.model";
import { Verification } from "../verification/verification.model";
import { Support } from "../HelpAndSupport/support.model";
import { Booking } from "../booking/booking.model";
import { Payment } from "../payment/payment.model";
import { Category } from "../category/category.model";
import { TermsModel } from "../terms&policy/terms&policy.model";
import { Review } from "../review/review.model";
import { Notification } from "../notification/notification.model";

import { emailQueue } from "../../../queues/email.queue";
import { redisDB } from "../../../redis/connectedUsers";

export class AdminService {

  public async overview( yearChart: string ) {
    const totalProviders = await User.countDocuments({ role: USER_ROLES.PROVIDER });
    const totalUsers = await User.countDocuments({ role: { $ne: USER_ROLES.ADMIN } });
    const upCommingOrders = await Booking.countDocuments({ bookingStatus: BOOKING_STATUS.ACCEPTED });

    const topProviders = await Review.aggregate([
      {
        $group: {
          _id: "$provider",
          reviewCount: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          lastReviewAt: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.role": USER_ROLES.PROVIDER,
          // "user.status": STATUS.ACTIVE,
        },
      },
      { $sort: { reviewCount: -1, avgRating: -1, lastReviewAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          image: "$user.image",
          category: "$user.category",
          reviewCount: 1,
          avgRating: { $round: ["$avgRating", 2] },
          lastReviewAt: 1,
        },
      },
    ]);

    const recentServices = await Booking.find({})
      .select("provider bookingStatus customer")
      .populate("provider", "name contact address category")
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const [{ totalRevenue = 0 } = {}] = await Payment.aggregate([
    { $match: { paymentStatus: PAYMENT_STATUS.PAYED } }, 
    {
      $addFields: {
        amountNum: {
          $cond: [
            { $isNumber: "$amount" },
            "$amount",
            { $toDouble: "$amount" },
          ],
        },
      },
    },
    { $group: { _id: null, totalRevenue: { $sum: "$amountNum" } } },
  ]);

    const year = Number(yearChart) || new Date().getFullYear();

    const monthly = await Payment.aggregate([
      {
        $match: {
          paymentStatus: PAYMENT_STATUS.PAYED, 
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalProfit: { $sum: "$amount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const result = monthNames.map((name, index) => {
      const monthIndex = index + 1;
      const found = monthly.find((m) => m._id === monthIndex);
      return {
        month: name,
        profit: found ? found.totalProfit : 0,
      };
    });

    return {
      totalUsers,
      totalProviders,
      upCommingOrders,
      totalRevenue,
      recentServices,
      topProviders,
      monthlyEarning: result,
    };
  }

  public async getUsers(query: IPaginationOptions & { role?: "user" | "provider" }) {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", role } = query;
    const skip = (page - 1) * limit;

    let filter: any = { role: { $ne: USER_ROLES.ADMIN } };
    if (role === "user") filter = { role: USER_ROLES.CLIENT };
    if (role === "provider") filter = { role: USER_ROLES.PROVIDER };

    const [data, total] = await Promise.all([
      User.find(filter)
        .select("name _id contact address role category status")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy as string]: sortOrder === "asc" ? 1 : -1 })
        .lean()
        .exec(),
      User.countDocuments(filter),
    ]);

    return buildPaginationResponse(data, total, page, limit);
  }

  public async getUser(id: string) {
    const result = await User.findById(new Types.ObjectId(id)).lean().exec();
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    if (result.role === USER_ROLES.CLIENT) {
      return {
        role: result.role,
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
      };
    }

    if (result.role === USER_ROLES.PROVIDER) {
      const reviews = await Review.find({ provider: result._id })
        .select("-updatedAt -__v -provider -service")
        .populate({ path: "creator", select: "name image" })
        .lean()
        .exec();

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

      const [completedWork, upCommingWork, cancelWork] = await Promise.all([
        Booking.countDocuments({ provider: result._id, bookingStatus: BOOKING_STATUS.COMPLETED }),
        Booking.countDocuments({ provider: result._id, bookingStatus: BOOKING_STATUS.ACCEPTED }),
        Booking.countDocuments({ provider: result._id, bookingStatus: BOOKING_STATUS.CANCELLED }),
      ]);

      const verificationFile = await Verification.find({ user: result._id }).lean().exec();

      return {
        name: result.name,
        role: result.role,
        image: result.image,
        category: result.category,
        gender: result.gender,
        dateOfBirth: result.dateOfBirth,
        nationality: result.nationality,
        email: result.email,
        whatsapp: result.whatsApp,
        contact: result.contact,
        address: result.address,

        completedWork,
        upCommingWork,
        cancelWork,

        experience: result.experience,
        totalDoneWork: completedWork,
        review: averageRating,

        expertise: result.category,
        country: result.nationality,
        serviceArea: result.address,
        serviceDistance: result.distance,
        availableTime: {
          startTime: result.startTime ?? "",
          endTime: result.endTime ?? "",
        },
        availableDay: result.availableDay,
        overview: result.overView,

        licenses:
          verificationFile?.length > 0 ? [verificationFile[0].license, verificationFile[0].nid] : [],
      };
    }

    // other roles if any
    return result;
  }

  public async addNewCategory(category: ICategory) {
    if (!category.image) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category name is required");
    }
    
    if (category.subCategory?.length > 0) category.subCategory = [];
    return Category.create(category);
  }

  public async getCategories(query: IPaginationOptions & { id?: string }) {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", id } = query;
    const skip = (page - 1) * limit;

    const mongoFilter = id ? { _id: id, isDeleted: false } : { isDeleted: false };

    const [result, total] = await Promise.all([
      Category.find(mongoFilter)
        .select("name image subCategory")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy as string]: sortOrder === "asc" ? 1 : -1 })
        .lean()
        .exec(),
      Category.countDocuments({ isDeleted: false }),
    ]);

    if (id) {
      if (result.length === 0) throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
      return result[0];
    }

    return buildPaginationResponse(result, total, page, limit);
  }

  public async updateCategory(id: string, category: ICategory) {
    const result = await Category.findByIdAndUpdate(new Types.ObjectId(id), category, {
      new: true,
    })
      .lean()
      .exec();
    if (!result) throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
    return result;
  }

  public async deleteCategory(id: string) {
    const result = await Category.findByIdAndUpdate(
      new Types.ObjectId(id),
      { isDeleted: true },
      { new: true }
    )
      .lean()
      .exec();
    if (!result) throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
    return result;
  }

  public async getTerms() {
    return TermsModel.findOne({ type: "terms" }).select("content -_id").lean().exec();
  }

  public async getPolicy() {
    return TermsModel.findOne({ type: "policy" }).select("content -_id").lean().exec();
  }

  public async upsertPolicy(policy: Partial<ITermsAndPolicy>) {
    const existing = await TermsModel.findOne({ type: "policy" }).lean().exec();
    if (!existing) {
      return TermsModel.create({ type: "policy", content: policy.content });
    }
    return TermsModel.findOneAndUpdate(
      { type: "policy" },
      { content: policy.content ?? existing.content },
      { new: true }
    )
      .select("content")
      .lean()
      .exec();
  }

  public async upsertTerms(terms: Partial<ITermsAndPolicy>) {
    const existing = await TermsModel.findOne({ type: "terms" }).lean().exec();
    if (!existing) {
      return TermsModel.create({ type: "terms", content: terms.content });
    }
    return TermsModel.findOneAndUpdate(
      { type: "terms" },
      { content: terms.content ?? existing.content },
      { new: true }
    )
      .select("content")
      .lean()
      .exec();
  }

  public async blockAndUnblockUser(id: string, block: "block" | "unblock") {
    const status =
      block === "block" ? STATUS.BLOCKED : block === "unblock" ? STATUS.ACTIVE : STATUS.BLOCKED;

    const result = await User.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status },
      { new: true }
    )
      .lean()
      .exec();

    if (!result) throw new ApiError(StatusCodes.BAD_REQUEST, "User not found");
    return result.status;
  }

  public async getRequests(query: IPaginationOptions) {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Verification.find({ status: VERIFICATION_STATUS.PENDING })
        .select("user status")
        .populate({
          path: "user",
          select: "name image category email contact nationalId",
        })
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy as string]: sortOrder === "asc" ? 1 : -1 })
        .lean()
        .exec(),
      Verification.countDocuments({ status: VERIFICATION_STATUS.PENDING }),
    ]);

    return buildPaginationResponse(data, total, page, limit);
  }

  public async approveOrReject(id: string, status: "approve" | "reject") {
    if (status !== "approve" && status !== "reject") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status");
    }

    const request = await Verification.findById(new Types.ObjectId(id)).lean().exec();
    if (!request) throw new ApiError(StatusCodes.BAD_REQUEST, "Request not found");

    if (
      request.status === VERIFICATION_STATUS.APPROVED ||
      request.status === VERIFICATION_STATUS.REJECTED
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Request already ${request.status}`);
    }

    const updated = await Verification.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        status: status === "approve" ? VERIFICATION_STATUS.APPROVED : VERIFICATION_STATUS.REJECTED,
      },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) throw new ApiError(StatusCodes.BAD_REQUEST, "Request not found");

    // Notification + socket
    const message = await Notification.create({
      for: request.user,
      message:
        "Your verification request has been " +
        (status === "approve" ? "approved" : "rejected"),
    });

    await emailQueue.add("socket-notification", message, {
      removeOnComplete: true,
      removeOnFail: false,
    });

    const isProviderOnline = await redisDB.get(`user:${request.user}`);
    if (!isProviderOnline) {
      const provider = await User.findById(request.user).lean().exec();
      await emailQueue.add(
        "push-notification",
        {
          notification: {
            title:
              "Your verification request has been " +
              (status === "approve" ? "approved" : "rejected"),
            body: `Admin has ${status === "approve" ? "approved" : "rejected"} your verification request`,
          },
          token: (provider as any)?.fcmToken,
        },
        { removeOnComplete: true, removeOnFail: false }
      );
    }

    return updated.status;
  }

  public async find(query: IPaginationOptions & { search: string; compo: "user" | "verification" | "support" }) {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search, compo } = query;
    const skip = (page - 1) * limit;
    const sort = { [sortBy as string]: sortOrder === "asc" ? 1 : -1 };

    const userFilter = { name: { $regex: search, $options: "i" } };

    const [users, totalUsers] = await Promise.all([
      User.find(userFilter)
        .select("name image category email contact nationalId")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy as string]: sortOrder === "asc" ? 1 : -1 })
        .lean()
        .exec(),
      User.countDocuments(userFilter),
    ]);

    if (compo === "user") {
      return buildPaginationResponse(users, totalUsers, page, limit);
    }

    if (compo === "verification") {
      const data = await Verification.find({ user: { $in: users.map((u: any) => u._id) } })
        .select("user status")
        .populate({ path: "user", select: "name image category email contact nationalId" })
        .lean()
        .exec();

      // total matches user count for pagination baseline
      return buildPaginationResponse(data, totalUsers, page, limit);
    }

    if (compo === "support") {
      const data = await Support.find({ user: { $in: users.map((u: any) => u._id) } })
        .select("user status title")
        .populate({ path: "user", select: "name image category email contact nationalId" })
        .lean()
        .exec();

      return buildPaginationResponse(data, totalUsers, page, limit);
    }

    // default
    return buildPaginationResponse([], 0, page, limit);
  }
}
