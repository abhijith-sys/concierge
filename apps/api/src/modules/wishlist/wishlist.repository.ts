import { prisma } from "../../shared/db/prisma.js";

export const wishlistRepository = {
  listForUser(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            category: true,
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                verified: true,
                status: true,
                logoUrl: true,
                coverUrl: true,
              },
            },
          },
        },
      },
    });
  },

  findListing(listingId: string) {
    return prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        business: { select: { status: true } },
      },
    });
  },

  add(userId: string, listingId: string) {
    return prisma.wishlistItem.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: {},
      create: { userId, listingId },
      include: {
        listing: {
          include: {
            category: true,
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                verified: true,
                status: true,
                logoUrl: true,
                coverUrl: true,
              },
            },
          },
        },
      },
    });
  },

  remove(userId: string, listingId: string) {
    return prisma.wishlistItem.deleteMany({
      where: { userId, listingId },
    });
  },
};
