import { BusinessStatus, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { ApiError } from "../errors/index.js";
import { prisma } from "../db/prisma.js";

export type AuthUser = { id: string; role: Role };

/** Shared pending-business visibility rule used by businesses and reviews. */
export function canViewBusiness(
  business: { ownerId: string; status: BusinessStatus },
  user?: AuthUser,
) {
  if (business.status === BusinessStatus.active) return true;
  return user?.role === Role.admin || (user?.id !== undefined && user.id === business.ownerId);
}

export function assertCanViewBusiness(
  business: { ownerId: string; status: BusinessStatus } | null | undefined,
  user?: AuthUser,
) {
  if (!business || !canViewBusiness(business, user)) {
    throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
  }
}

type Tx = Prisma.TransactionClient;

/** Recalculate listing avgRating / reviewCount after review mutations. */
export async function recalculateListingRating(tx: Tx, businessId: string) {
  const aggregate = await tx.review.aggregate({
    where: { businessId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await tx.listing.update({
    where: { businessId },
    data: {
      avgRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    },
  });
}

export async function availableBusinessSlug(base: string) {
  let candidate = base || "business";
  let suffix = 1;
  while (await prisma.business.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}
