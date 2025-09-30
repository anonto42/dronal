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

  public async deleteProfile(user: JwtPayload) {
    const existingUser = await this.userRepo.findById(new Types.ObjectId(user.id!));
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    // const isMatch = data.password && await bcrypt.compare(data.password, existingUser.password);
    // if (!isMatch) {
    //   throw new ApiError(
    //     StatusCodes.NOT_FOUND,
    //     "Password not match!"
    //   )
    // };

    await this.userRepo.update(existingUser._id, { status: STATUS.DELETED });

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
  
      // Handle distance and rating filters
      let providerIds: any[] = [];
      
      if (distance || rating) {
        const userDoc = await this.userRepo.findById(new Types.ObjectId(user.id));
        if (!userDoc) {
          throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
        }
  
        // Build provider query for distance and rating
        const providerQuery: any = {};
  
        // Handle distance filter
        if (distance && userDoc.location?.coordinates) {
          providerQuery.location = {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: userDoc.location.coordinates,
              },
              $maxDistance: Number(distance) * 1000,
            },
          };
        }
  
        // Handle rating filter
        if (rating) {
          // Get providers with average rating >= specified rating
          const ratedProviders = await Review.aggregate([
            {
              $group: {
                _id: "$provider",
                averageRating: { $avg: "$rating" }
              }
            },
            {
              $match: {
                averageRating: { $gte: Number(rating) }
              }
            }
          ]);
  
          const ratedProviderIds = ratedProviders.map(rp => rp._id);
          
          if (providerQuery._id) {
            providerQuery._id.$in = providerQuery._id.$in.filter((id: any) => 
              ratedProviderIds.includes(id.toString())
            );
          } else {
            providerQuery._id = { $in: ratedProviderIds };
          }
        }
  
        // Find providers that match the criteria
        const matchingProviders = await User.find(providerQuery).select('_id');
        providerIds = matchingProviders.map(provider => provider._id);
  
        // Add provider filter to service query
        if (providerIds.length > 0) {
          query.creator = { $in: providerIds };
        } else {
          // If no providers match, return empty result
          return {
            data: [],
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: 0,
              totalPages: 0
            }
          };
        }
      }
  
      // Get user's favorite providers once
      const favoriteProviders = await CustomerFavorite.find({ 
        customer: new Types.ObjectId(user.id) 
      }).select('provider').lean();
  
      const favoriteProviderIds = favoriteProviders.map(fav => fav.provider.toString());
  
      // Execute main query
      const [services, total] = await Promise.all([
        Service.find(query)
          .populate('creator', 'name image contact address location category experience')
          .sort(sortOption)
          .limit(Number(limit))
          .skip(skip)
          .lean()
          .exec(),
        Service.countDocuments(query)
      ]);
  
      // Add review counts and favorite status
      const servicesWithStats = await Promise.all(
        services.map(async (service) => {
          const reviewCount = await Review.countDocuments({ 
            provider: service.creator?._id 
          });
  
          const averageRating = await Review.aggregate([
            { $match: { provider: service.creator?._id } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
          ]);
  
          const isFavorite = favoriteProviderIds.includes(service.creator?._id.toString());
  
          return {
            ...service,
            providerStats: {
              reviewCount,
              averageRating: averageRating.length > 0 ? 
                Math.round(averageRating[0].averageRating * 10) / 10 : 0,
              isFavorite
            }
          };
        })
      );
  
      return {
        data: servicesWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      };
  
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
      select: "creator category image price",
      paginationOptions: {
        limit: query.servicesLimit,
        page: query.servicesPage,
        sortOrder: query.servicesSortOrder
      },
      populate: {
        path: "creator",
        select: "name image"
      }
    });

    const completedTask = await this.userRepo.findBookings({ filter: { provider: provider._id, bookingStatus: BOOKING_STATUS.COMPLETED } });

    const reviews = await this.userRepo.getReviews({ provider: provider._id },"-updatedAt",{
      limit: query.reviewLimit,
      page: query.reviewPage,
      sortOrder: query.reviewSortOrder
    });

    let averageRating = 0;

    if (reviews.length > 0) {
      const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      averageRating = total / reviews.length;
    }

    const validationRequests = await this.userRepo.getValidationRequests({ user: provider._id },"-updatedAt");

    const isFavorite = await this.userRepo.getFavorites({ customer: user.id!, provider: provider._id },"provider");

    return {
      isFavorite: isFavorite?.length > 0,
      services,
      reviews,
      provider:{
        name: provider.name,
        image: provider.image,
        experience: provider.experience,
        complitedTask: completedTask?.length ?? 0,
        rating: averageRating,
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

    await emailQueue.add("socket-notification", notification, {
      removeOnComplete: true,
      removeOnFail: false,
    });

    return booking;
  }

  public async addFavorite(user: JwtPayload, id: Types.ObjectId) {
    const isFavorite = await this.userRepo.getFavorites({ customer: new Types.ObjectId(user.id!), provider: id },"provider");
    if(isFavorite?.length > 0) throw new ApiError(StatusCodes.BAD_REQUEST, "Provider is already in the favorite list!");
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

}
