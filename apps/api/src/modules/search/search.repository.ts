import type { Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";
import type { SearchQuery } from "./search.schemas.js";

const listingInclude = { listing: { include: { category: true } } } as const;

function buildWhere(query: SearchQuery): Prisma.BusinessWhereInput {
  return {
    status: "active",
    listing: {
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
              { business: { name: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
      ...(query.rating !== undefined ? { avgRating: { gte: query.rating } } : {}),
      ...(query.category
        ? {
            category: {
              OR: [{ slug: query.category }, { parent: { slug: query.category } }],
            },
          }
        : {}),
    },
  };
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
