import { BusinessStatus, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { ApiError } from "../errors/index.js";
import { prisma } from "../db/prisma.js";

export type AuthUser = { id: string; role: Role };

/** Public can only see active businesses; owner/admin can see pending/suspended (not deleted unless admin). */
export function canViewBusiness(
  business: { ownerId: string; status: BusinessStatus },
  user?: AuthUser,
) {
  if (business.status === BusinessStatus.active) return true;
  if (business.status === BusinessStatus.deleted) {
    return user?.role === Role.admin;
  }
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

/** Approximate degrees for a km radius at mid-latitudes (bounding box prefilter). */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}
