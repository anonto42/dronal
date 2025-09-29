import { Types } from "mongoose";

export interface IPayment {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: Types.ObjectId;
  booking: Types.ObjectId;
  amount: number;
  paymentStatus: string;
}
