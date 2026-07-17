import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const searchRouter = Router();

const querySchema = z.object({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  open: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function isOpenNow(hours: unknown, now = new Date()) {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return false;
  const interval = (hours as Record<string, unknown>)[dayNames[now.getDay()]];
  if (!Array.isArray(interval) || interval.length !== 2 || interval.some((value) => typeof value !== "string")) {
    return false;
  }
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return current >= interval[0] && current <= interval[1];
}

searchRouter.get("/", async (req, res) => {
  const query = querySchema.parse(req.query);
  const where: Prisma.BusinessWhereInput = {
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
              OR: [
                { slug: query.category },
                { parent: { slug: query.category } },
              ],
            },
          }
        : {}),
    },
  };

  const businesses = await prisma.business.findMany({
    where,
    include: { listing: { include: { category: true } } },
    orderBy: [
      { listing: { featured: "desc" } },
      { listing: { avgRating: "desc" } },
      { name: "asc" },
    ],
  });
  const filtered = query.open
    ? businesses.filter((business) => isOpenNow(business.listing?.hours))
    : businesses;
  const total = filtered.length;
  const start = (query.page - 1) * query.pageSize;
  const items = filtered.slice(start, start + query.pageSize);

  res.json({
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
    filters: {
      q: query.q ?? null,
      city: query.city ?? null,
      category: query.category ?? null,
      rating: query.rating ?? null,
      open: query.open ?? false,
    },
  });
});
