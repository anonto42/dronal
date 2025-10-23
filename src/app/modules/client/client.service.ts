import { ClientRepository } from './client.repository';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from '../user/user.interface';
import { IPaginationOptions } from '../../../types/pagination';
import { STATUS } from '../../../enums/user';
import { Types } from 'mongoose';
import { TServicePagination } from '../../../types/client';
import { IBooking } from '../booking/booking.interface';
import { BOOKING_STATUS } from '../../../enums/booking';
import { createCheckoutSession, refunds } from '../../../helpers/stripeHelper';
import { Request } from 'express';
import { Service } from '../service/service.model';
import { CustomerFavorite } from '../favorites/customer.favorite.model';
import { Review } from '../review/review.model';
import { User } from '../user/user.model';
import { Notification } from '../notification/notification.model';
import { emailQueue } from '../../../queues/email.queue';
import { redisDB } from '../../../redis/connectedUsers';
import { PAYMENT_STATUS } from '../../../enums/payment';
import { calculateDistanceInKm } from '../../../helpers/calculateDistance';
import bcrypt from "bcrypt";

export class ClientService {
  private userRepo: ClientRepository;

  constructor() {
    this.userRepo = new ClientRepository();
  }

  public async getUserProfile(user: JwtPayload) {
    const existingUser = await this.userRepo.findById(user.id!,"name image gender email address dateOfBirth nationality whatsApp contact");
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    return existingUser;
  }

  public async updateProfile(user: JwtPayload, payload: Partial<IUser>) {
    const existingUser = await this.userRepo.findById(user.id!);
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    if (payload.image && existingUser.image) unlinkFile(existingUser.image!);

    await this.userRepo.update(user.id!, payload);

    return payload
  }

  public async deleteProfile(user: JwtPayload, password: string) {
    const existingUser = await this.userRepo.findById(new Types.ObjectId(user.id!),"+password");
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    const isMatch = password && await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Password not match!"
      )
    };

    await this.userRepo.delete(existingUser._id);

  }

  public async getServices(user: JwtPayload, pagination: IPaginationOptions) {
    const { 
      category,
      subCategory,
      price,
      distance,
      search,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = 10,
      page = 1
    } = pagination as any;
  
    try {
      const skip = (Number(page) - 1) * Number(limit);
      const sortOption: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  
      // Build the base query
      let query: any = { isDeleted: { $ne: true } };
  
      // Handle search
      if (search) {
        query.$or = [
          { category: { $regex: search, $options: "i" } },
          { subCategory: { $regex: search, $options: "i" } }
        ];
      }
  
      // Handle category filters
      if (category) query.category = category;
      if (subCategory) query.subCategory = subCategory;
      if (price) query.price = { $lte: Number(price) };
  
      // Get user's favorite providers once
      const favoriteProviders = await CustomerFavorite.find({ 
        customer: new Types.ObjectId(user.id) 
      }).select('provider').lean();
  
      const favoriteProviderIds = favoriteProviders.map(fav => fav.provider.toString());
  
      // Execute main query
      const [services, total] = await Promise.all([
        Service.find(query)
          .populate('creator', '_id name image contact address location category experience')
          .sort(sortOption)
          .limit(Number(limit))
          .skip(skip)
          .lean()
          .exec(),
        Service.countDocuments(query)
      ]);
  
      // Add review counts and favorite status and cordinates
      const servicesWithStats = await Promise.all(
        services.map(async (service) => {
          const reviewCount = await Review.countDocuments({ 
            provider: service.creator?._id 
          });
  
          const averageRating = await Review.aggregate([
            { $match: { provider: service.creator?._id } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
          ]);

          const coordinates = await User.findById( service.creator._id ).lean().exec();
  
          const isFavorite = favoriteProviderIds.includes(service.creator?._id.toString());
  
          return {
            ...service,
            providerStats: {
              coordinates: coordinates,
              reviewCount,
              averageRating: averageRating.length > 0 ? 
                Math.round(averageRating[0].averageRating * 10) / 10 : 0,
              isFavorite
            }
          };
        })
      );

      const formetedData = servicesWithStats.map(service => {
        return {
          service:{
            _id: service._id,
            image: service.image,
            category: service.category,
            price: service.price,
            subCategory: service.subCategory
          },
          provider: {//@ts-ignore
            image: service.creator?.image,//@ts-ignore
            name: service.creator?.name,
            _id: service.creator._id,
            reviewCount: service.providerStats.reviewCount,
            coordinates: service?.providerStats?.coordinates?.location.coordinates,
            averageRating: service.providerStats.averageRating,
            isFavorite: service.providerStats.isFavorite
          }
        };
      });

      if (distance && rating) {
        const currentUser = await User.findById(user.id).select("location").lean().exec().then( e => e?.location.coordinates ).catch( e => console.error(e) ) as any;
        const allCountedDistance = formetedData.map( e => ({
          ...e,//@ts-ignore
          distance: Math.round(calculateDistanceInKm(currentUser[1]!,currentUser[0]!, e.provider.coordinates[1], e.provider.coordinates[0]))
        }));
        return allCountedDistance.filter( e => e.provider.averageRating >= rating ).filter( e => e.distance <= distance );
      }
  
      return formetedData;
  
    } catch (error: any) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to fetch services: ${error.message}`
      );
    }
  }

  public async getProviderById(user: JwtPayload, id: Types.ObjectId, query: TServicePagination) {

    const provider = await this.userRepo.findById(id);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    const services = await this.userRepo.findMany({ 
      filter: { creator: id, isDeleted: false },
      select: "creator category image price expertise",
      paginationOptions: {
        limit: query.servicesLimit,
        page: query.servicesPage,
        sortOrder: query.servicesSortOrder
      },
      populate: {
        path: "creator",
        select: "name image category"
      }
    });

    const completedTask = await this.userRepo.findBookings({ filter: { provider: provider._id, bookingStatus: BOOKING_STATUS.COMPLETED } });

    const reviews = await this.userRepo.getReviews({
      filter: { provider: provider._id },
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

    const validationRequests = await this.userRepo.getValidationRequests({ user: provider._id },"-updatedAt");

    const isFavorite = await this.userRepo.getFavorites({ customer: user.id!, provider: provider._id },"provider");

    return {
      services,
      reviews:{
        overview: {
          averageRating,
          totalReviews: reviews.length,
          start:{
            oneStar: reviews.filter(r => r.rating === 1).length,
            twoStar: reviews.filter(r => r.rating === 2).length,
            threeStar: reviews.filter(r => r.rating === 3).length,
            fourStar: reviews.filter(r => r.rating === 4).length,
            fiveStar: reviews.filter(r => r.rating === 5).length,
          }
        },
        all: reviews,
      },
      provider:{
        _id: provider._id,
        name: provider.name,
        image: provider.image,
        category: provider.category,
        experience: provider.experience,
        complitedTask: completedTask?.length ?? 0,
        rating: averageRating,
        isFavorite: isFavorite?.length > 0,
      },
      overView:{
        overView: provider.overView,
        language: provider.language,
        address: provider.address,
        serviceDestance: provider.distance,
        availableDay: provider.availableDay,
        startTime: provider.startTime,
        endTime: provider.endTime,
        license: validationRequests?.license ?? "",
      }
    };
  }

  public async sendBooking (payload: JwtPayload, data: IBooking, req: Request) {
    
    const service = await this.userRepo.findMany({ filter: { _id: data.service } });
    if (!service) throw new ApiError(StatusCodes.NOT_FOUND, "Service not found!");
  
    const provider = await this.userRepo.findById(service[0].creator);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    const customer = await this.userRepo.findById(payload.id!);
    if (!customer) throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found!");

    const booking = await this.userRepo.createBooking({
      customer: customer._id,
      provider: provider._id,
      service: service[0]._id,
      date: data.date,
      location: data.location,
      address: data.address,
      specialNote: data.specialNote,
      bookingStatus: data.bookingStatus
    });

    const url = await createCheckoutSession(req, service[0].price, { bookingId: booking._id.toString(), providerId: provider._id.toString(), serviceId: service[0]._id.toString(), customerId: customer._id.toString() }, service[0].category);

    await this.userRepo.updateBooking(booking._id, { transactionId: url.id });

    return url;
  }

  public async updateBooking (user: JwtPayload, id: Types.ObjectId, data: IBooking) {
    const booking = await this.userRepo.updateBooking(id, data);
    if (!booking) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");

    return booking;
  }

  public async getBookings (user: JwtPayload, query: IPaginationOptions, body: { status: "pending" | "upcoming" | "history" | "completed" | "canceld" }) {
    
    const bookings = await this.userRepo.findBookings({ 
      filter: { 
        customer: user.id!, //@ts-ignore
        isDeleted: { $ne: true }, 
        isPaid: true, //@ts-ignore
        bookingStatus: body.status == "pending" ? BOOKING_STATUS.PENDING : body.status == "upcoming" ? BOOKING_STATUS.ACCEPTED : body.status == "completed" ? BOOKING_STATUS.COMPLETED : body.status == "canceld" ? BOOKING_STATUS.REJECTED : { $ne: BOOKING_STATUS.ACCEPTED }, //@ts-ignore        
      },
      paginationOptions: query,
      select: "provider service createdAt date bookingStatus", //@ts-ignore
      populate: [
        {
          path: "provider",
          select: "name image"
        },
        {
          path: "service",
          select: "name image price category subCategory"
        }
      ]
    });

    if (!bookings?.length) return [];

    const formattedBookings = bookings.map((booking: any) => {
      return {
        _id: booking._id,
        image: booking.service.image,
        category: booking.service.category,
        price: booking.service.price,
        providerName: booking.provider.name,
        subCategory: booking.service.subCategory,
        date: booking.date,
        status: booking.bookingStatus,
      };
    });

    return formattedBookings;
  }
  
  public async cancelBooking (user: JwtPayload, id: Types.ObjectId) {
    const booking = await this.userRepo.cancelBooking(id);
    if (!booking) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");

    if (booking.bookingStatus == BOOKING_STATUS.CANCELLED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already cancelled");
    }

    if (booking.bookingStatus == BOOKING_STATUS.ACCEPTED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already accepted");
    }

    if (booking.bookingStatus == BOOKING_STATUS.COMPLETED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already completed");
    }

    if (booking.bookingStatus == BOOKING_STATUS.REJECTED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already rejected");
    }

    await this.userRepo.updatePayment({
      filter: { booking: new Types.ObjectId(booking._id) },
      payload: { paymentStatus: PAYMENT_STATUS.REFUNDED }
    });
    
    const notification = await Notification.create({
      for: booking.provider,
      message: "Your Booking cancelled"
    })

    //@ts-ignore
    const refundAmount = ( booking.service.price * 0.05 ) * 100 ;
    
    // Have to discous the amount
    await refunds.create({
      payment_intent: booking.paymentId,// @ts-ignore
      amount: refundAmount,
    })

    const isProviderOnline = await redisDB.get(`user:${booking.provider}`);
    if (!isProviderOnline) {
      const provider = await this.userRepo.findById(booking.provider) as IUser;
      await emailQueue.add("push-notification", {
        notification: {
          title: "Booking Cancelled",
          body: "Your Booking cancelled"
        },
        token: provider?.fcmToken
      }, {
        removeOnComplete: true,
        removeOnFail: false,
      });
    }

    // await emailQueue.add("socket-notification", notification, {
    //   removeOnComplete: true,
    //   removeOnFail: false,
    // });


    //@ts-ignore
    const socket = global.io;
    const userId = notification.for;
    const socketId = await redisDB.get(`user:${userId}`);
    
    socket.to(socketId!).emit("notification", notification)
    

    return booking;
  }

  public async addFavorite(user: JwtPayload, id: Types.ObjectId) {
    const isFavorite = await this.userRepo.getFavorites({ customer: new Types.ObjectId(user.id!), provider: id },"provider");
    // If already added then remove it
    if(isFavorite?.length > 0) {
      const provider = await this.userRepo.removeFavorite(id);
      if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Favorite item is not exist on the list!");
      return {
        message: "Favorite removed successfully",
      };
    };
    const provider = await this.userRepo.addFavorite(new Types.ObjectId(user.id!), id);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    return provider.provider;
  }

  public async removeFavorite(user: JwtPayload, id: Types.ObjectId) {
    const provider = await this.userRepo.removeFavorite(id);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Favorite item is not exist on the list!");

    return provider.provider;
  }

  public async getFavorites(user: JwtPayload) {
    const favorites = await this.userRepo.getFavorites({ customer: new Types.ObjectId(user.id!) },"name image overView");
    if (!favorites) throw new ApiError(StatusCodes.NOT_FOUND, "Favorites not found!");

    return favorites;
  }

  public async bookScreen( id: string, query: IPaginationOptions ){
    return await this.userRepo.findMany({
      filter: { creator: new Types.ObjectId(id) },
      paginationOptions: query,
      select: "image price category subCategory",
      populate: {
        path: "creator",
        select: "name image"
      }
    })
  }

  public async seeBooking (user: JwtPayload, id: string ) {
  
    const booking = await this.userRepo.findBookings({ filter: { _id: new Types.ObjectId(id) },//@ts-ignore
     populate: [{
      path: "service",
      select: "image price category subCategory"
    },{
      path: "provider",
      select: "name image address category"
    }] });
    if (!booking.length) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");
  
    return {
      service: {
        ...booking[0].service,
        date: booking[0].date
      },
      details: {
        status: booking[0].bookingStatus,//@ts-ignore
        fee: booking[0].service.price,   //@ts-ignore
        address: booking[0].address, //@ts-ignore
        specialNote: booking[0].specialNote, //@ts-ignore
        provider: booking[0].provider //@ts-ignore
      }
    };
  }

  public async getCategories(query: IPaginationOptions) {
    const categories = await this.userRepo.getCategories(query);
    if (!categories) throw new ApiError(StatusCodes.NOT_FOUND, "Categories not found!");

    return categories;
  }

  public async acceptBooking (user: JwtPayload, id: string ) {
    const booking = await this.userRepo.findBookings({ filter: { _id: new Types.ObjectId(id) },//@ts-ignore
     populate: [{
      path: "service",
      select: "image price category subCategory"
    },{ 
      path: "provider",
      select: "name image address category"
    }] });
    if (!booking.length) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");

    if (booking[0].bookingStatus == BOOKING_STATUS.PENDING) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already pending");
    }

    if (booking[0].bookingStatus == BOOKING_STATUS.COMPLETED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already completed");
    }

    if (booking[0].bookingStatus == BOOKING_STATUS.CANCELLED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already cancelled");
    }

    if (booking[0].bookingStatus == BOOKING_STATUS.REJECTED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already rejected");
    }

    await this.userRepo.updateBooking(new Types.ObjectId(id), { bookingStatus: BOOKING_STATUS.COMPLETED });
    
    await this.userRepo.updatePayment({
      filter: { booking: new Types.ObjectId(id) },
      payload: { paymentStatus: PAYMENT_STATUS.PAID }
    });

    const findProvider = await this.userRepo.findById(booking[0].provider) as IUser;
    if (!findProvider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    //@ts-ignore
    const provider = await this.userRepo.findAndUpdateProvider(booking[0].provider, { wallet: findProvider.wallet + booking[0].service.price }) as IUser;
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    const notification = await Notification.create({
      for: booking[0].provider,
      message: "Your Booking accepted"
    })

    const isProviderOnline = await redisDB.get(`user:${booking[0].provider}`);
    if (!isProviderOnline) {
      const provider = await this.userRepo.findById(booking[0].provider) as IUser;
      await emailQueue.add("push-notification", {
        notification: {
          title: "Booking Accepted",
          body: "Your Booking accepted"
        },
        token: provider?.fcmToken
      }, {
        removeOnComplete: true,
        removeOnFail: false,
      });
    };

    // await emailQueue.add("socket-notification", notification, {
    //   removeOnComplete: true,
    //   removeOnFail: false,
    // });

    //@ts-ignore
    const socket = global.io;
    const userId = notification.for;
    const socketId = await redisDB.get(`user:${userId}`);
    socket.to(socketId!).emit("notification", notification)

    return ;
  }

  public async giveReview (user: JwtPayload, id: string, data: { feedback: string, rating: number }) {

    const booking = await this.userRepo.findBookings({ filter: { _id: new Types.ObjectId(id) },//@ts-ignore
     populate: [{
      path: "service",
      select: "image price category subCategory"
    },{ 
      path: "provider",
      select: "name image address category"
    }] });
    if (!booking.length) throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found!");

    const review = await this.userRepo.giveReview({
      creator: new Types.ObjectId(user.id!),
      provider: booking[0].provider,
      review: data.feedback,
      rating: data.rating,
      service: booking[0].service
    });
    if (!review) throw new ApiError(StatusCodes.NOT_FOUND, "Review not created!");

    return review;
  }

  public async walteHistory (user: JwtPayload, query: IPaginationOptions) {
    const provider = await this.userRepo.findById(user.id) as IUser
        
    const wallet = await this.userRepo.wallet({
      filter: { 
        customer: new Types.ObjectId (user.id),// @ts-ignore
        $or: [
          { paymentStatus: PAYMENT_STATUS.PAID },
          { paymentStatus: PAYMENT_STATUS.PROVIDER_CANCELLED }
        ] 
      },
      paginationOptions: query,
      select: "service amount paymentStatus",//@ts-ignore
      populate: [
        {
          path: "service",
          select: "image category subCategory"  
        }
      ]
    });
    
    return {
      balance: provider.wallet,
      history: wallet
    };
  }

  public async paymentHistoryPage ( id?: string ) {
    if( !id ) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, "You must give the id!");

    const info = await this.userRepo.wallet({
      filter: { 
        _id: new Types.ObjectId( id )
      },// @ts-ignore
      populate: "customer service",
      select: "customer provider service booking amount paymentStatus createdAt"
    });

    const data = info[0]
    if( !data ) throw new ApiError(StatusCodes.NOT_FOUND, "Payment details not found!")

    return {
      serviceInfo: {//@ts-ignore
        amount: data.service.price,//@ts-ignore
        category: data.service.category,//@ts-ignore
        subCategory: data.service.subcategory,
        status: data.paymentStatus
      },
      userInformation: {//@ts-ignore
        name: data.customer.name,//@ts-ignore
        location: data.customer.address,//@ts-ignore
        email: data.customer.email
      },
      paymentDetails: {//@ts-ignore
        serviceFee: data.amount,//@ts-ignore
        dateAndTime: data.createdAt
      }
    }
  }

}
