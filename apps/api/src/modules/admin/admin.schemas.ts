import { BusinessStatus } from "@prisma/client";
import { z } from "zod";

export const adminListSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.nativeEnum(BusinessStatus).optional(),
  verified: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(7).max(30).nullable().optional(),
    verified: z.boolean().optional(),
    status: z.nativeEnum(BusinessStatus).optional(),
    featured: z.boolean().optional(),
    description: z.string().trim().min(20).max(10_000).optional(),
    address: z.string().trim().min(3).max(300).optional(),
    city: z.string().trim().min(2).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
