import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  open: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
