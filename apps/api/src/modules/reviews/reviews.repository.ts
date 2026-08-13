import { prisma } from "../../shared/db/prisma.js";
import { recalculateListingRating } from "../../shared/domain/business.js";

export const reviewsRepository = {
  findBusinessForList(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, status: true },
    });
  },

  findBusinessForCreate(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, status: true, listing: { select: { id: true } } },
    });
  },

  findExistingReview(userId: string, businessId: string) {
    return prisma.review.findUnique({
      where: { userId_businessId: { userId, businessId } },
      select: { id: true },
    });
  },

  list(businessId: string, page: number, pageSize: number) {
    const where = { businessId };
    return prisma.$transaction([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.review.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      select: { userId: true, businessId: true },
    });
  },

  createWithAggregate(data: {
    businessId: string;
    rating: number;
    comment: string;
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data,
        include: { user: { select: { id: true, name: true } } },
      });
      await recalculateListingRating(tx, data.businessId);
      return created;
    });
  },

  deleteWithAggregate(id: string, businessId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recalculateListingRating(tx, businessId);
    });
  },
};
