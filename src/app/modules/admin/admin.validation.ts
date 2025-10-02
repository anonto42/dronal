import { z } from "zod";

const usersAdminSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.string().optional().default("createdAt"),
    role: z.enum(["user", "provider", "all"]).optional().default("all"),
  }).strict()
});

const idParamsAdminSchema = z.object({
  params: z.object({
    id: z.string({ invalid_type_error: "User id is required" })
  }).strict()
});

const addNewCategorySchema = z.object({
  body: z.object({
    name: z.string({ invalid_type_error: "Category name is required" }),
    subCategory: z.array(z.string({ invalid_type_error: "Subcategory is required" })).optional(),
  }).strict()
});

const getCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.string().optional().default("createdAt"),
    id: z.string().optional(),
  }).strict()
});

const updateCategorySchema = z.object({
  body: z.object({
    id: z.string({ required_error: "Category id is required" }),
    name: z.string({ invalid_type_error: "Category name is required" }).optional(),
    subCategory: z.array(z.string({ invalid_type_error: "Subcategory is required" })).optional(),
  }).strict()
});

const updatePolicySchema = z.object({
  body: z.object({
    content: z.string({ invalid_type_error: "Policy content is required" }).optional(),
  }).strict()
});

const updateTermsSchema = z.object({
  body: z.object({
    content: z.string({ invalid_type_error: "Terms content is required" }).optional(),
  }).strict()
});

const blockAndUnblockUserSchema = z.object({
  params: z.object({
    id: z.string({ invalid_type_error: "User id is required" }),
    status: z.enum(["block", "unblock"], { required_error: "Status is required" }),
  }).strict()
});

const getRequestsSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.string().optional().default("createdAt"),
    id: z.string().optional(),
  }).strict()
});

const approveOrRejectSchema = z.object({
  params: z.object({
    id: z.string({ invalid_type_error: "User id is required" }),
    status: z.enum(["approve", "reject"], { required_error: "Status is required" }),
  }).strict()
});

export const AdminValidation = {
  usersAdminSchema,
  idParamsAdminSchema,
  addNewCategorySchema,
  getCategoriesSchema,
  updateCategorySchema,
  updatePolicySchema,
  updateTermsSchema,
  blockAndUnblockUserSchema,
  getRequestsSchema,
  approveOrRejectSchema,
};
