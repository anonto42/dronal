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
import { Service } from "../service/service.model";

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
      { $limit: 3 },
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

    const recentServices = await Booking.find({
      bookingStatus: BOOKING_STATUS.COMPLETED
    })
      .select("provider bookingStatus customer date")
      .populate("provider", "name contact address category")
      .populate("customer", "name")
      .populate("service", "price")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const payments = await Payment.find({
      booking: { $in: recentServices.map(b => b._id) }
    }).select("booking paymentId paymentStatus");

    const enhancedRecentServices = recentServices.map(service => {
      const payment = payments.find(p => p.booking.toString() === service._id.toString());
      return {
          ...service,
          paymentId: payment ? payment._id : null,
          paymentStatus: payment ? payment.paymentStatus : null,
      };
    });
      
    const [{ totalRevenue = 0 } = {}] = await Payment.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } }, 
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
          paymentStatus: PAYMENT_STATUS.PAID, 
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
      recentServices: enhancedRecentServices,
      topProviders,
      monthlyEarning: result,
    };
  }

  public async getUsers(
    query: IPaginationOptions & { role?: "user" | "provider"; search?: string }
  ) {

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      role,
      search,
    } = query;

    const skip = (page - 1) * limit;

    const filter: any = {
      role: { $ne: USER_ROLES.ADMIN },
      status: { $ne: STATUS.DELETED },
    };
    
    if (role === "user") filter.role = USER_ROLES.CLIENT;
    if (role === "provider") filter.role = USER_ROLES.PROVIDER;

    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .select("name _id contact address role category status email")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .lean()
        .exec(),
      User.countDocuments(filter),
    ]);

    // 📦 Return paginated response
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
    
    if (category.subCategory?.length <= 0) category.subCategory = [];
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

  public async blockAndUnblockUser(id: string, block: "block" | "unblock" | "delete") {
    const status =
      block === "block" ? STATUS.BLOCKED : block === "unblock" ? STATUS.ACTIVE : block === "delete"? STATUS.DELETED : STATUS.BLOCKED;

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

  public async getRequests(query: IPaginationOptions & { search?: string; status?: string }) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      status,
    } = query;

    const skip = (page - 1) * limit;

    const queryFilter: any = {};

    if (status) {
      if (status === "APPROVED") queryFilter.status = VERIFICATION_STATUS.APPROVED;
      else if (status === "PENDING") queryFilter.status = VERIFICATION_STATUS.PENDING;
      else if (status === "REJECTED") queryFilter.status = VERIFICATION_STATUS.REJECTED;
      else if (status === "UNVERIFIED") queryFilter.status = VERIFICATION_STATUS.UNVERIFIED;
    }

    const userFilter: any = {};
    if (search && search.trim() !== "") {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } }
      ];
    }

    let userIds: string[] = [];
    if (Object.keys(userFilter).length > 0) {
      const matchedUsers = await User.find(userFilter).select("_id").lean();
      userIds = matchedUsers.map((u) => u._id.toString());
      queryFilter.user = { $in: userIds };
    }

    const [data, total] = await Promise.all([
      Verification.find(queryFilter)
        .select("user status")
        .populate({
          path: "user",
          select: "name image category email contact nationalId",
        })
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .lean()
        .exec(),
      Verification.countDocuments(queryFilter),
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

    // await emailQueue.add("socket-notification", message, {
    //   removeOnComplete: true,
    //   removeOnFail: false,
    // });

    //@ts-ignore
    const socket = global.io;
    const userId = message.for;
    const socketId = await redisDB.get(`user:${userId}`);
    
    socket.to(socketId!).emit("notification", message)


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

  public async bookingData(query: IPaginationOptions & { search: string; status: string }) {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", status, search } = query;

    let queryDB: any = {};

    // Handle booking status filter
    if (status) {
      switch (status.toLowerCase()) {
        case "accepted":
          queryDB.bookingStatus = BOOKING_STATUS.ACCEPTED;
          break;
        case "cancelled":
          queryDB.bookingStatus = BOOKING_STATUS.CANCELLED;
          break;
        case "rejected":
          queryDB.bookingStatus = BOOKING_STATUS.REJECTED;
          break;
        case "pending":
          queryDB.bookingStatus = BOOKING_STATUS.PENDING;
          break;
        case "completed":
          queryDB.bookingStatus = BOOKING_STATUS.COMPLETED;
          break;
      }
    }

    // Handle search functionality
    if (search && search.trim() !== "") {
      const providerIds = (await User.find({ name: { $regex: search, $options: "i" } }).select("_id")).map(u => u._id);
      const customerIds = (await User.find({ name: { $regex: search, $options: "i" } }).select("_id")).map(u => u._id);
      const serviceIds = (await Service.find({ category: { $regex: search, $options: "i" } }).select("_id")).map(s => s._id);

      queryDB.$or = [
        { provider: { $in: providerIds } },
        { customer: { $in: customerIds } },
        { service: { $in: serviceIds } },
      ];
    }

    // Fetch bookings and payment details in parallel
    const [data, total] = await Promise.all([
      Booking.find(queryDB)
        .select("provider bookingStatus customer date service")
        .populate("provider", "name contact address category")
        .populate("customer", "name")
        .populate("service", "name price category")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Booking.countDocuments(queryDB),
    ]);

    const payments = await Payment.find({
      booking: { $in: data.map(b => b._id) } 
    }).select("booking paymentId paymentStatus");

    
    const enhancedData = data.map(booking => {
      const payment = payments.find(p => p.booking.toString() === booking._id.toString());
      return {
        ...booking,
        paymentId: payment ? payment._id : null, 
        paymentStatus: payment ? payment.paymentStatus : null,
      };
    });

    return buildPaginationResponse(enhancedData, total, page, limit);
  }
  
}
