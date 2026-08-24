import { z } from "zod";

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates");

export const roomSelectionSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export const createStayEnquirySchema = z
  .object({
    businessId: z.string().uuid(),
    guestName: z.string().trim().min(2).max(120),
    guestEmail: z.string().trim().email().max(254),
    guestPhone: z.string().trim().min(7).max(30).optional(),
    checkIn: dateOnly,
    checkOut: dateOnly,
    adults: z.coerce.number().int().min(1).max(50),
    children: z.coerce.number().int().min(0).max(50).default(0),
    notes: z.string().trim().max(2000).optional(),
    roomSelections: z.array(roomSelectionSchema).min(1).max(20),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export const updateStayEnquirySchema = z
  .object({
    status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
    ownerNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const stayEnquiryListSchema = z.object({
  businessId: z.string().uuid().optional(),
  status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateStayEnquiryInput = z.infer<typeof createStayEnquirySchema>;
export type UpdateStayEnquiryInput = z.infer<typeof updateStayEnquirySchema>;
export type StayEnquiryListQuery = z.infer<typeof stayEnquiryListSchema>;
