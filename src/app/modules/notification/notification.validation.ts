import { z } from "zod";

const deleteNotificationSchema = z.object({
  body: z.object({
    ids: z.array( z.string() ).optional()
  }).strict()
});

const getNotificationSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    sortOrder: z.enum([ "desc", "asc"]).optional()
  }).strict()
});

const updateNotificationSchema = z.object({
  body: z.object({
    ids: z.array( z.string() ).optional(),
    id: z.string().optional()
  }).strict()
});

export const NotificationValidation = {
  deleteNotificationSchema,
  updateNotificationSchema,
  getNotificationSchema
};
