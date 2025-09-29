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
import { createCheckoutSession } from '../../../helpers/stripeHelper';
import { Request } from 'express';

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

  // Need to work
  public async getServices(user: JwtPayload, pagication: IPaginationOptions) {
    const services = await this.userRepo.findMany({ 
      filter: { isDeleted: false },
      select: "-updatedAt",
      paginationOptions: pagication,
      populate: {
        path: "creator",
        select: "name image"
      }
    });

    return services;
  }

  // Have to work on it
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

    const reviews = await this.userRepo.getReviews({ provider: provider._id },"-updatedAt");

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
        complitedTask: 9, // Have to add 
        rating: 4.5, // Have to count later
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

  // Have to add notification
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

    if (!bookings?.length) throw new ApiError(StatusCodes.NOT_FOUND, "Bookings not found!");

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

}
