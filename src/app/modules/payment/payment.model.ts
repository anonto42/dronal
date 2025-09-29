import { Schema, model } from "mongoose";
import { IPayment } from "./payment.interface";
import { PAYMENT_STATUS } from "../../../enums/payment";

const paymentSchema = new Schema<IPayment>({
  customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: Schema.Types.ObjectId, ref: "User", required: true },
  service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, required: true, enum: PAYMENT_STATUS },
}, { timestamps: true });

export const Payment = model<IPayment>("Payment", paymentSchema);
