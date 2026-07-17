import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const reviewsRouter = Router();

const listQuerySchema = z.object({
  businessId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

reviewsRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const where = { businessId: query.businessId };
  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where }),
  ]);
  res.json({
    reviews,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  });
});

const createSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2_000),
});

reviewsRouter.post("/", requireAuth, async (req, res) => {
  const data = createSchema.parse(req.body);
  const business = await prisma.business.findUnique({
    where: { id: data.businessId },
    select: { id: true, ownerId: true, listing: { select: { id: true } } },
  });
  if (!business?.listing) {
    throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
  }
  if (business.ownerId === req.user!.id) {
    throw new ApiError(403, "OWN_BUSINESS_REVIEW", "Owners cannot review their own business");
  }
  const existing = await prisma.review.findUnique({
    where: { userId_businessId: { userId: req.user!.id, businessId: data.businessId } },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "REVIEW_EXISTS", "You have already reviewed this business");
  }
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { ...data, userId: req.user!.id },
      include: { user: { select: { id: true, name: true } } },
    });
    const aggregate = await tx.review.aggregate({
      where: { businessId: data.businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.listing.update({
      where: { businessId: data.businessId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
    return created;
  });
  res.status(201).json({ review });
});

reviewsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const review = await prisma.review.findUnique({
    where: { id },
    select: { userId: true, businessId: true },
  });
  if (!review) {
    throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
  }
  if (review.userId !== req.user!.id && req.user!.role !== Role.admin) {
    throw new ApiError(403, "FORBIDDEN", "Only the review author or an administrator can delete this review");
  }
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    const aggregate = await tx.review.aggregate({
      where: { businessId: review.businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.listing.update({
      where: { businessId: review.businessId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  });
  res.status(204).send();
});
