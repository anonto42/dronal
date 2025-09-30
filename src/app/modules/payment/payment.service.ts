import { PaymentRepository } from "./payment.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { checkout } from "../../../helpers/stripeHelper";
import { htmlTemplate } from "../../../shared/htmlTemplate";
import { PAYMENT_STATUS } from "../../../enums/payment";
import { emailQueue } from "../../../queues/email.queue";
import { Notification } from "../notification/notification.model";
import { redisDB } from "../../../redis/connectedUsers";

export class PaymentService {
  private paymentRepo: PaymentRepository;

  constructor() {
    this.paymentRepo = new PaymentRepository();
  }
  
  public async success(query: any) {
    
    const sessionId = query.sessionId;
    if (!sessionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Session ID is required");
    }

    const session = await checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Session not found");
    }

    if (session.payment_status !== "paid") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Payment not completed");
    }

    const serviceId = new Types.ObjectId(session?.metadata?.serviceId);
    const providerId = new Types.ObjectId(session?.metadata?.providerId);
    const customerId = new Types.ObjectId(session?.metadata?.customerId);
    const bookingID = new Types.ObjectId(session?.metadata?.bookingId)

    const booking = await this.paymentRepo.findBooking(bookingID);
    if (!booking) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking not found");
    }
    if(booking.isPaid){
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking already paid");
    }
    if(!booking.transactionId){
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking transaction ID not found");
    }

    const bookingUpdate = await this.paymentRepo.updateBooking(bookingID);
    if (!bookingUpdate) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Booking not found");
    }

    const service = await this.paymentRepo.findService(serviceId);
    if (!service) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Service not found");
    }

    const provider = await this.paymentRepo.findProvider(providerId);
    if (!provider) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Provider not found");
    }

    const customer = await this.paymentRepo.findCustomer(customerId);
    if (!customer) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Customer not found");
    }

    await this.paymentRepo.create({
      service: serviceId,
      provider: providerId,
      customer: customerId,
      booking: booking._id,
      amount: service.price,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
    })

    const message = await Notification.create({
      for: providerId,
      message: "You have a new booking request",
    });

    await emailQueue.add("socket-notification", message, {
      removeOnComplete: true,
      removeOnFail: false,
    });

    const isProviderOnline = await redisDB.get(`user:${booking.provider}`);
    if (!isProviderOnline) {
      const provider = await this.paymentRepo.findProvider(providerId);
      await emailQueue.add("push-notification", {
        notification: {
          title: "You got a new booking request",
          body: `${customer.name} has requested a booking for ${service.category}`
        },
        token: provider?.fcmToken
      }, {
        removeOnComplete: true,
        removeOnFail: false,
      });
    };

    return htmlTemplate.paymentSuccess();
  }
}
