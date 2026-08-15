import type { Prisma } from "@prisma/client";
import { boundingBox } from "../../shared/domain/business.js";
import { prisma } from "../../shared/db/prisma.js";
import type { SearchQuery } from "./search.schemas.js";

const listingInclude = {
  listing: { include: { category: true } },
  services: { where: { isActive: true, approvalStatus: "approved" }, take: 5 },
} as const;

function categorySlugMatch(slug: string): Prisma.CategoryWhereInput {
  return {
    OR: [{ slug }, { parent: { slug } }, { parent: { parent: { slug } } }],
  };
}

function buildWhere(query: SearchQuery): Prisma.BusinessWhereInput {
  const categorySlug = query.subcategory ?? query.category;
  const box =
    query.lat !== undefined && query.lng !== undefined
      ? boundingBox(query.lat, query.lng, query.radiusKm ?? 10)
      : null;

  const filters: Prisma.BusinessWhereInput[] = [
    { status: "active" },
    {
      listing: {
        ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
        ...(query.rating !== undefined ? { avgRating: { gte: query.rating } } : {}),
        ...(box
          ? {
              lat: { gte: box.minLat, lte: box.maxLat },
              lng: { gte: box.minLng, lte: box.maxLng },
            }
          : {}),
      },
    },
  ];

  if (query.q) {
    filters.push({
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        {
          listing: {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          },
        },
        {
          services: {
            some: {
              isActive: true,
              approvalStatus: "approved",
              name: { contains: query.q, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (categorySlug) {
    filters.push({
      OR: [
        { listing: { is: { category: categorySlugMatch(categorySlug) } } },
        {
          services: {
            some: {
              isActive: true,
              approvalStatus: "approved",
              category: categorySlugMatch(categorySlug),
            },
          },
        },
      ],
    });
  }

  return { AND: filters };
}

const orderBy: Prisma.BusinessOrderByWithRelationInput[] = [
  { listing: { featured: "desc" } },
  { listing: { avgRating: "desc" } },
  { name: "asc" },
];

export const searchRepository = {
  buildWhere,
  orderBy,

  findMany(where: Prisma.BusinessWhereInput, skip: number, take: number) {
    return prisma.business.findMany({
      where,
      include: listingInclude,
      orderBy,
      skip,
      take,
    });
  },

  count(where: Prisma.BusinessWhereInput) {
    return prisma.business.count({ where });
  },

  findAllMatching(where: Prisma.BusinessWhereInput) {
    return prisma.business.findMany({
      where,
      include: listingInclude,
      orderBy,
    });
  },
};
