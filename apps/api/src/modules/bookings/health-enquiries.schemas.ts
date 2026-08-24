import { z } from "zod";

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates");

const timeOnly = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Use HH:MM time")
  .optional();

export const serviceSelectionSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export const createHealthEnquirySchema = z.object({
  businessId: z.string().uuid(),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().min(7).max(30).optional(),
  appointmentDate: dateOnly,
  appointmentTime: timeOnly,
  patients: z.coerce.number().int().min(1).max(20).default(1),
  concern: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  serviceSelections: z.array(serviceSelectionSchema).min(1).max(20),
});

export const updateHealthEnquirySchema = z
  .object({
    status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
    ownerNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const healthEnquiryListSchema = z.object({
  businessId: z.string().uuid().optional(),
  status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateHealthEnquiryInput = z.infer<typeof createHealthEnquirySchema>;
export type UpdateHealthEnquiryInput = z.infer<typeof updateHealthEnquirySchema>;
export type HealthEnquiryListQuery = z.infer<typeof healthEnquiryListSchema>;
