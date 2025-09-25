import { z } from 'zod';

const updateUserZodSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
});

export const ClientValidation = {
  updateUserZodSchema,
};
