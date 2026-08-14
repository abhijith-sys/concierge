import { z } from "zod";

export const addWishlistSchema = z.object({
  listingId: z.string().uuid(),
});

export type AddWishlistInput = z.infer<typeof addWishlistSchema>;
