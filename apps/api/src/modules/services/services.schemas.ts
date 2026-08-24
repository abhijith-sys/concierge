import { z } from "zod";
import { fieldValueInputSchema } from "../categories/categories.repository.js";

const mediaUrl = z.string().min(1).max(500).refine((value) => {
  if (value.startsWith("/uploads/") || value.startsWith("/assets/")) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Only HTTP(S), /uploads, or /assets paths are allowed");

export const createServiceSchema = z.object({
  businessId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
  price: z.coerce.number().min(0).max(1_000_000),
  currency: z.string().trim().length(3).default("USD"),
  durationMinutes: z.coerce.number().int().min(5).max(24 * 60).optional(),
  images: z.array(mediaUrl).max(20).default([]),
  isActive: z.boolean().default(true),
  pricingType: z
    .enum(["fixed", "starting_from", "hourly", "daily", "weekly", "monthly", "contact", "custom"])
    .optional(),
  fieldValues: z.array(fieldValueInputSchema).max(100).optional(),
});

export const updateServiceSchema = createServiceSchema
  .omit({ businessId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
