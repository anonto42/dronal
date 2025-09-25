import { z } from "zod";
import { GENDER } from "../../../enums/user";

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

export const ProviderValidation = {
  updateProviderProfileSchema,
};