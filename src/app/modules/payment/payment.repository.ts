import { Payment } from "./payment.model";
import { IPayment } from "./payment.interface";
import { Types } from "mongoose";
import { Service } from "../service/service.model";
import { User } from "../user/user.model";
import { Booking } from "../booking/booking.model";
import { BOOKING_STATUS } from "../../../enums/booking";

export class PaymentRepository {
  async findById(id: Types.ObjectId) {
    return Payment.findById(id).lean().exec();
  }

  async create(payload: Partial<IPayment>) {
    return Payment.create(payload);
  }

  async update(id: Types.ObjectId, payload: Partial<IPayment>) {
    return Payment.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async delete(id: Types.ObjectId) {
    return Payment.findByIdAndDelete(id).lean().exec();
  }

  async findService(serviceId: Types.ObjectId) {
    return Service.findById(serviceId).lean().exec();
  }

  async findProvider(providerId: Types.ObjectId) {
    return User.findById(providerId).lean().exec();
  }

  async findCustomer(customerId: Types.ObjectId) {
    return User.findById(customerId).lean().exec();
  }

  async findBooking(serviceId: Types.ObjectId) {
    return Booking.findById(serviceId).lean().exec();
  }

  async updateBooking(serviceId: Types.ObjectId, paymentId: string) {
    return Booking.findByIdAndUpdate(serviceId,{ isPaid: true, transactionId: null, paymentId }, { new: true }).lean().exec();
  }
}
    
