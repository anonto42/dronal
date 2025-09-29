import { z } from "zod";

const createPaymentSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Payment name is required" }),
  }),
});

export const PaymentValidation = {
  createPaymentSchema,
};
