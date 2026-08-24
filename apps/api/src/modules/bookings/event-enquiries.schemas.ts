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

export const packageSelectionSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export const createEventEnquirySchema = z.object({
  businessId: z.string().uuid(),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().min(7).max(30).optional(),
  eventDate: dateOnly,
  eventTime: timeOnly,
  venue: z.string().trim().min(2).max(200),
  guests: z.coerce.number().int().min(1).max(5000).default(1),
  notes: z.string().trim().max(2000).optional(),
  packageSelections: z.array(packageSelectionSchema).min(1).max(20),
});

export const updateEventEnquirySchema = z
  .object({
    status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
    ownerNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const eventEnquiryListSchema = z.object({
  businessId: z.string().uuid().optional(),
  status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateEventEnquiryInput = z.infer<typeof createEventEnquirySchema>;
export type UpdateEventEnquiryInput = z.infer<typeof updateEventEnquirySchema>;
export type EventEnquiryListQuery = z.infer<typeof eventEnquiryListSchema>;
