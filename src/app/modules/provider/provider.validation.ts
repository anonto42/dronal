import { z } from "zod";
import { GENDER } from "../../../enums/user";
import { SERVICE_DAY } from "../../../enums/service";

const updateProviderProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(), 
    overView: z.string().optional(), 
    gender: z.enum([ GENDER.MAN, GENDER.WOMAN, GENDER.OTHER ], { invalid_type_error: `You must give the gender ${GENDER.OTHER} or ${GENDER.MAN} or ${GENDER.WOMAN}`}).optional(), 
    dateOfBirth: z.string().optional(), 
    nationality: z.string().optional(), 
    experience: z.string().optional(), 
    language: z.string().optional(), 
    contact: z.string().optional(), 
    whatsApp: z.string().optional(), 
    nationalId: z.string().optional(), 
    address: z.string().optional(),
  }).strict()
});

const createServiceSchema = z.object({
  body: z.object({
    category: z.string({ required_error: "Category is required" }),
    subCategory: z.string({ required_error: "SubCategory is required" }),
    price: z.coerce.number({ required_error: "Price is required" }),
    distance: z.coerce.number({ required_error: "Distance is required" }),
    availableDay: z.array(z.enum([SERVICE_DAY.FRI,SERVICE_DAY.MON,SERVICE_DAY.SAT,SERVICE_DAY.SUN,SERVICE_DAY.THU,SERVICE_DAY.TUE,SERVICE_DAY.WED]), { invalid_type_error: "Available day is required" }),
    startTime: z.string({ required_error: "Start time is required" }),
    endTime: z.string({ required_error: "End time is required" }),
  }).strict()
});

const updateServiceSchema = z.object({
  params: z.object({
    id: z.string({ invalid_type_error: "Service id is required" })
  }),
  body: z.object({
    category: z.string({ invalid_type_error: "Category is required" }).optional(),
    subCategory: z.string({ invalid_type_error: "SubCategory is required" }).optional(),
    price: z.coerce.number({ invalid_type_error: "Price is required" }).optional(),
    distance: z.coerce.number({ invalid_type_error: "Distance is required" }).optional(),
    availableDay: z.array(z.enum([SERVICE_DAY.FRI,SERVICE_DAY.MON,SERVICE_DAY.SAT,SERVICE_DAY.SUN,SERVICE_DAY.THU,SERVICE_DAY.TUE,SERVICE_DAY.WED]), { invalid_type_error: "Available day is required" }).optional(),
    startTime: z.string({ invalid_type_error: "Start time is required" }).optional(),
    endTime: z.string({ invalid_type_error: "End time is required" }).optional(),
    longitude: z.coerce.number().optional(),
    latitude: z.coerce.number().optional(),
  }).strict()
});

const deleteServiceSchema = z.object({
  params: z.object({
    id: z.string({ invalid_type_error: "Service id is required" })
  }).strict()
});

const viewServiceSchema = z.object({
  params: z.object({
    id: z.string({ invalid_type_error: "Service id is required" })
  }).strict()
});

export const ProviderValidation = {
  updateProviderProfileSchema,
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
  viewServiceSchema
};