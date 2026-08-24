import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  subcategory: z.string().trim().max(100).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  open: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  verified: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(50).default(10).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  kind: z.enum(["supplier", "service"]).optional(),
  sort: z.enum(["relevance", "rating", "distance"]).default("relevance").optional(),
}).refine(
  (value) => (value.lat === undefined) === (value.lng === undefined),
  "lat and lng must be provided together",
);

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const suggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  city: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type SuggestQuery = z.infer<typeof suggestQuerySchema>;
