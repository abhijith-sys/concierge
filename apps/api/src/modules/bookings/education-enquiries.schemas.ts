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

export const courseSelectionSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export const createEducationEnquirySchema = z.object({
  businessId: z.string().uuid(),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().min(7).max(30).optional(),
  startDate: dateOnly,
  preferredTime: timeOnly,
  learningMode: z.string().trim().max(40).optional(),
  learners: z.coerce.number().int().min(1).max(100).default(1),
  notes: z.string().trim().max(2000).optional(),
  courseSelections: z.array(courseSelectionSchema).min(1).max(20),
});

export const updateEducationEnquirySchema = z
  .object({
    status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
    ownerNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const educationEnquiryListSchema = z.object({
  businessId: z.string().uuid().optional(),
  status: z.enum(["new", "viewed", "responded", "closed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateEducationEnquiryInput = z.infer<typeof createEducationEnquirySchema>;
export type UpdateEducationEnquiryInput = z.infer<typeof updateEducationEnquirySchema>;
export type EducationEnquiryListQuery = z.infer<typeof educationEnquiryListSchema>;
