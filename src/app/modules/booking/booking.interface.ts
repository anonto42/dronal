import { Types } from "mongoose";
import { BOOKING_STATUS } from "../../../enums/booking";

export interface IBooking {
    _id: Types.ObjectId;
    customer: Types.ObjectId;
    provider: Types.ObjectId;
    service: Types.ObjectId;
    status: [string];
    date: Date;
    location: {
        type: string;
        coordinates: number[];
    };
    address: string;
    specialNote: string;
    bookingStatus: BOOKING_STATUS;
    isPaid: boolean;
    rejectReason: string;
    paymentId: string;
    isDeleted: boolean;
    transactionId: string;
}