import { z } from "zod";

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates");

export const itemSelectionSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

export const createRentalEnquirySchema = z
  .object({
    businessId: z.string().uuid(),
    guestName: z.string().trim().min(2).max(120),
    guestEmail: z.string().trim().email().max(254),
    guestPhone: z.string().trim().min(7).max(30).optional(),
    hireFrom: dateOnly,
    hireTo: dateOnly,
    deliveryRequested: z.boolean().optional().default(false),
    notes: z.string().trim().max(2000).optional(),
    itemSelections: z.array(itemSelectionSchema).min(1).max(20),
  })
  .refine((data) => data.hireTo >= data.hireFrom, {
    message: "Hire-to must be on or after hire-from",
    path: ["hireTo"],
  });

export const updateRentalEnquirySchema = z
  .object({
    status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
    ownerNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const rentalEnquiryListSchema = z.object({
  businessId: z.string().uuid().optional(),
  status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateRentalEnquiryInput = z.infer<typeof createRentalEnquirySchema>;
export type UpdateRentalEnquiryInput = z.infer<typeof updateRentalEnquirySchema>;
export type RentalEnquiryListQuery = z.infer<typeof rentalEnquiryListSchema>;
