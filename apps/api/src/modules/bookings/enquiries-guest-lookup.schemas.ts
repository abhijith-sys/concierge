import { z } from "zod";

export const guestEnquiryLookupSchema = z.object({
  email: z.string().trim().email().max(254),
  ref: z.string().uuid().optional(),
});

export type GuestEnquiryLookupQuery = z.infer<typeof guestEnquiryLookupSchema>;

export type GuestEnquiryLookupItem = {
  id: string;
  vertical: string;
  status: string;
  createdAt: Date;
  business: { id: string; name: string; slug: string };
  summary: string;
};
