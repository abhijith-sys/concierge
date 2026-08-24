import { z } from "zod";

export const mineEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type MineEnquiriesQuery = z.infer<typeof mineEnquiriesQuerySchema>;

export type MineEnquiryItem = {
  id: string;
  vertical:
    | "stay"
    | "rental"
    | "travel"
    | "event"
    | "logistics"
    | "education"
    | "health"
    | "professional"
    | "home_trade"
    | "automotive"
    | "electronics";
  status: string;
  createdAt: Date;
  business: { id: string; name: string; slug: string } | null;
  summary: string;
};
