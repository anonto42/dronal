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

const aProviderZodSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Favorite id is required" }),
  }).strict(),
  query: z.object({
    servicesLimit: z.coerce.number().optional().default(15),
    servicesPage: z.coerce.number().optional().default(1),
    servicesSortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }).strict(),
});

const getBookingZodSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }).strict(),
  body: z.object({
    status: z.enum([ 'pending', 'upcoming', 'history', 'completed', 'canceld'],{ required_error: "Status is required" }),
  }).strict()
});

const createBookingZodSchema = z.object({
  body: z.object({
    service: z.string({ required_error: "Service id is required" }),
    date: z.coerce.date(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    address: z.string(),
    specialNote: z.string(),
  }).strict(),
});

const updateBookingZodSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Booking id is required" }),
  }).strict(),
  body: z.object({
    date: z.coerce.date().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    address: z.string().optional(),
    specialNote: z.string().optional(),
  }).strict(),
});

const removeBookingZodSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Booking id is required" }),
  }).strict(),
});

const getCategoriesZodSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }).strict(),
});

export const ClientValidation = {
  updateUserZodSchema,
  getPaginationZodSchema,
  AddFavoriteZodSchema,
  RemoveFavoriteZodSchema,
  aProviderZodSchema,
  updateBookingZodSchema,
  createBookingZodSchema,
  getBookingZodSchema,
  removeBookingZodSchema,
  getCategoriesZodSchema,
};
