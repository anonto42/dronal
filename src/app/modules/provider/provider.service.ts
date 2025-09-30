import { ProviderRepository } from "./provider.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../user/user.interface";
import unlinkFile from "../../../shared/unlinkFile";
import { IVerificaiton } from "../verification/verification.interface";
import { STATUS, VERIFICATION_STATUS } from "../../../enums/user";
import { IService } from "../service/service.interface";
import bcrypt from "bcryptjs";
import { IPaginationOptions } from "../../../types/pagination";
import { Notification } from "../notification/notification.model";
import { emailQueue } from "../../../queues/email.queue";
import { BOOKING_STATUS } from "../../../enums/booking";
import { redisDB } from "../../../redis/connectedUsers";

export class ProviderService {
  private providerRepo: ProviderRepository;

  constructor() {
    this.providerRepo = new ProviderRepository();
  }

  public async profile(
    payload: JwtPayload
  ) {
    const provider = await this.providerRepo.findById(
      new mongoose.Types.ObjectId( payload.id ),
      "name image overView gender dateOfBirth nationality experience language contact whatsApp nationalId email address distance availableDay startTime endTime"
    )
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found!"
      )
    }

    return provider
  }

  public async profileUpdate(
    payload: JwtPayload,
    data: Partial<IUser>
  ) {
    const provider = await this.providerRepo.update(
      new mongoose.Types.ObjectId( payload.id ),
      data
    )
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found!"
      )
    }
    if (payload.image && provider.image) unlinkFile(provider.image);

    return data
  }

  public async profileDelete(
    payload: JwtPayload,
    data: { password: string }
  ) {
    
    const provider = await this.providerRepo.findById( new mongoose.Types.ObjectId( payload.id ),"+password");
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found"
      )
    };

    const isMatch = data.password && await bcrypt.compare(data.password, provider.password);
    if (!isMatch) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Password not match!"
      )
    };

    await this.providerRepo.update(provider._id, { status: STATUS.DELETED });

  }

  public async verificaitonStatusCheck(
    payload: JwtPayload
  ) {
    const userId = new mongoose.Types.ObjectId( payload.id );
    const request = await this.providerRepo.viewVerification(userId);
    const user = await this.providerRepo.findById(userId);
    
    return request? { 
      message: "This is your current request status", 
      user: {
        name: user?.name,
        image: user?.image,
        category: user?.category,
        data: request
    }} : { 
      message: "You don't have send the request!", 
      user: {
        name: user?.name,
        image: user?.image,
        category: user?.category,
        data: null
    }}
  }

  public async sendVerificaitonRequest(
    payload: JwtPayload,
    data: IVerificaiton
  ) {
    const userObjID = new mongoose.Types.ObjectId( payload.id );
    const isVerifirequestExist = await this.providerRepo.viewVerification( userObjID );
    if (isVerifirequestExist) {
      if (isVerifirequestExist.status == VERIFICATION_STATUS.PENDING) {
        throw new ApiError(
          StatusCodes.EXPECTATION_FAILED,
          "You are already sended the request so you must wait"
        )
      }
    }

    if (!data.license) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "License not found!"
      )
    }
    
    if (!data.nid) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "License not found!"
      )
    }
    
    if (!isVerifirequestExist) {
      await this.providerRepo.createVerificationRequest({
        ...data,
        status: VERIFICATION_STATUS.PENDING,
        user: payload.id
      })
      return
    }
    //@ts-ignore
    delete isVerifirequestExist?.status

    await this.providerRepo.updateVerificationRequest(isVerifirequestExist._id,{
      ...data,
      status: VERIFICATION_STATUS.PENDING
    })

    const admins = await this.providerRepo.getAdmins();
    
    admins.forEach(async (admin) => {
      const notification = await Notification.create({
        for: admin._id,
        message: "A new verification request has been sent"
      })
      await emailQueue.add("socket-notification", notification, {
        removeOnComplete: true,
        removeOnFail: false,
      });
    })

    return data
  }

  public async providerServices(
    payload: JwtPayload,
    query: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: "asc" | "desc";
    }
  ) {
    const result = await this.providerRepo.providerServices({
      filter: { creator: new mongoose.Types.ObjectId( payload.id ), isDeleted: false },
      paginationOptions: query,
      select:"-__v -updatedAt -creator"
    });
    return result
  }

  public async addService(
    payload: JwtPayload,
    data: Partial<IService>
  ) {

    if(!data.image){
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Image not found!"
      )
    }
    
    const result = await this.providerRepo.addService({...data, creator: new mongoose.Types.ObjectId( payload.id )});

    //@ts-ignore
    delete result.creator
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id

    return result
  }

  public async deleteService(
    payload: JwtPayload,
    id: string
  ) {
    const result = await this.providerRepo.deleteService(new mongoose.Types.ObjectId(id));
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Service not found!"
      )
    }

    //@ts-ignore
    delete result.user
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id

    return result
  }

  public async updateService(
    payload: JwtPayload,
    id: string,
    data: Partial<IService>
  ) {

    const result = await this.providerRepo.updateService(new mongoose.Types.ObjectId(id),data);
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Service not found!"
      )
    }

    if (data.image && result.image) {
      unlinkFile(result.image);
    }

    //@ts-ignore
    delete result.creator
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id
    
    return result
  }

  public async viewService(
    payload: JwtPayload,
    id: string
  ) {
    const result = await this.providerRepo.providerServices({
      filter: { creator: new mongoose.Types.ObjectId( payload.id ), _id: new mongoose.Types.ObjectId( id ) },
      paginationOptions: { page: 1, limit: 1 },
      select:"-__v -updatedAt -creator"
    });
    if (!result.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Service not found!"
      )
    }

    //@ts-ignore
    delete result.creator
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id
    
    return result[0]
  }

  public async getBookings (user: JwtPayload, query: IPaginationOptions, body: { status: "pending" | "upcoming" | "history" | "rejected" | "completed" }) {

    const bookings = await this.providerRepo.findBookings({ 
      filter: { 
        provider: user.id!,
        isPaid: true,
        //@ts-ignore
        isDeleted: { $ne: true }, //@ts-ignore
        bookingStatus: body.status == "pending" ? BOOKING_STATUS.PENDING : body.status == "upcoming" ? BOOKING_STATUS.ACCEPTED : body.status == "rejected" ? BOOKING_STATUS.REJECTED : body.status == "completed" ? BOOKING_STATUS.COMPLETED : { $ne: BOOKING_STATUS.PENDING } //@ts-ignore
      },
      paginationOptions: query,
      select: "customer service date bookingStatus", //@ts-ignore
      populate: [
        {
          path: "customer",
          select: "name image address"
        },
        {
          path: "service",
          select: "name image price category subCategory"
        }
      ]
    });
  
    if (!bookings?.length) throw new ApiError(StatusCodes.NOT_FOUND, "Bookings not found!");
  
    return bookings;
  }
  
  public async actionBooking (user: JwtPayload, data: { bookId: string, action: "accept" | "reject", reason?: string }) {
      const booking = await this.providerRepo.findBookings({ filter: { _id: new mongoose.Types.ObjectId(data.bookId) } });
      
      if (!booking.length) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");
      if (booking[0].bookingStatus != BOOKING_STATUS.PENDING) throw new ApiError(StatusCodes.NOT_FOUND, "Booking already interacted!");

      if (data.action == "accept") {
        await this.providerRepo.updateBooking(new mongoose.Types.ObjectId(data.bookId), { bookingStatus: BOOKING_STATUS.ACCEPTED });

        const notification = await Notification.create({
          for: booking[0].customer,
          message: "Your Booking accepted"
        })

        const isProviderOnline = await redisDB.get(`user:${booking[0].customer}`);
        if (!isProviderOnline) {
          const customer = await this.providerRepo.findById(booking[0].customer) as IUser;
          await emailQueue.add("push-notification", {
            notification: {
              title: "Booking Accepted",
              body: "Your Booking accepted"
            },
            token: customer?.fcmToken
          }, {
            removeOnComplete: true,
            removeOnFail: false,
          });
        }
    
        await emailQueue.add("socket-notification", notification, {
          removeOnComplete: true,
          removeOnFail: false,
        })

      }else if (data.action == "reject") {
        await this.providerRepo.updateBooking(new mongoose.Types.ObjectId(data.bookId), { bookingStatus: BOOKING_STATUS.REJECTED, rejectReason: data.reason });

        const notification = await Notification.create({
          for: booking[0].customer,
          message: "Your Booking rejected"
        })

        const isProviderOnline = await redisDB.get(`user:${booking[0].customer}`);
        if (!isProviderOnline) {
          const customer = await this.providerRepo.findById(booking[0].customer) as IUser;
          await emailQueue.add("push-notification", {
            notification: {
              title: "Booking Rejected",
              body: "Your Booking rejected"
            },
            token: customer?.fcmToken
          }, {
            removeOnComplete: true,
            removeOnFail: false,
          });
        }
    
        await emailQueue.add("socket-notification", notification, {
          removeOnComplete: true,
          removeOnFail: false,
        })
      }
  
  }

  public async seeBooking (user: JwtPayload, id: string ) {

    const provider = await this.providerRepo.findById(user.id);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    const booking = await this.providerRepo.findBookings({ filter: { _id: new mongoose.Types.ObjectId(id) },//@ts-ignore
     populate: [{
      path: "service",
      select: "image price category subCategory"
    },{
      path: "customer",
      select: "name image address category"
    }] });
    if (!booking.length) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");

    return {
      service: {
        ...booking[0].service,
        date: booking[0].date
      },
      details: {
        distance: provider.distance,
        status: booking[0].bookingStatus,//@ts-ignore
        fee: booking[0].service.price,   //@ts-ignore
        address: booking[0].address, //@ts-ignore
        specialNote: booking[0].specialNote, //@ts-ignore
        customer: booking[0].customer, //@ts-ignore
        paymentStatus: booking[0].paymentStatus //@ts-ignore
      }
    };
  }

  public async getCategories (query: IPaginationOptions) {
    return this.providerRepo.getCategories(query);
  }

  public async getCustomer (user: string) {
    const customer = this.providerRepo.findById(new mongoose.Types.ObjectId(user),"name image address gender dateOfBirth nationality contact whatsApp");
    if (!customer) throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found!");
    return customer
  }

}
