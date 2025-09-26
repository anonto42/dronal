import { z } from 'zod';

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    dateOfBirth: z.string().optional(),
    nationality: z.string().optional(),
    whatsApp: z.string().optional(),
    contact: z.string().optional(),
    longitude: z.string().optional(),
    latitude: z.string().optional(),
  }).strict()
});

const getPaginationZodSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }).strict(),
});

const AddFavoriteZodSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Provider id is required" }),
  }).strict(),
});

const RemoveFavoriteZodSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Favorite id is required" }),
  }).strict(),
});

export const ClientValidation = {
  updateUserZodSchema,
  getPaginationZodSchema,
  AddFavoriteZodSchema,
  RemoveFavoriteZodSchema,
};
