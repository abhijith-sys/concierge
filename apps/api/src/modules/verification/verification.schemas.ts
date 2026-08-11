import { z } from "zod";

const urlOrPath = z.string().min(1).max(500);

export const verificationDraftSchema = z.object({
  businessId: z.string().uuid(),
  ownerPhotoUrl: urlOrPath.optional(),
  locationPhotoUrl: urlOrPath.optional(),
  storefrontPhotoUrl: urlOrPath.optional(),
  documentUrl: urlOrPath.optional(),
  selfieUrl: urlOrPath.optional(),
  videoUrl: urlOrPath.nullable().optional(),
});

export const verificationReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().max(2000).optional(),
  activateBusiness: z.boolean().default(true),
});
