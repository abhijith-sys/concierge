import { BusinessStatus } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { wishlistRepository } from "./wishlist.repository.js";

export const wishlistService = {
  async list(userId: string) {
    return wishlistRepository.listForUser(userId);
  },

  async add(userId: string, listingId: string) {
    const listing = await wishlistRepository.findListing(listingId);
    if (!listing || listing.business.status !== BusinessStatus.active) {
      throw new ApiError(404, "LISTING_NOT_FOUND", "Listing is not available to save");
    }
    return wishlistRepository.add(userId, listingId);
  },

  async remove(userId: string, listingId: string) {
    await wishlistRepository.remove(userId, listingId);
  },
};
