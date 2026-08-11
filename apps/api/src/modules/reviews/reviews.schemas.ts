import { z } from "zod";

export const listReviewsSchema = z.object({
  businessId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const createReviewSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2_000),
});

export type ListReviewsQuery = z.infer<typeof listReviewsSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
