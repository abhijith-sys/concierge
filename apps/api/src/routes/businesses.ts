import { BusinessStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../middleware/auth.js";

export const businessesRouter = Router();

const httpUrl = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Only HTTP(S) URLs are allowed");
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time format");
const hoursSchema = z.record(z.string(), z.tuple([time, time]).nullable());

const listingFields = {
  categoryId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(10_000),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  hours: hoursSchema.optional(),
  images: z.array(httpUrl).max(20).default([]),
  website: httpUrl.optional(),
  featured: z.boolean().optional(),
};

const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180).optional(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30).optional(),
  logoUrl: httpUrl.optional(),
  ...listingFields,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 170);
}

async function availableSlug(base: string) {
  let candidate = base || "business";
  let suffix = 1;
  while (await prisma.business.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

businessesRouter.get("/:slugOrId", async (req, res) => {
  const value = z.string().min(1).max(200).parse(req.params.slugOrId);
  const isId = z.string().uuid().safeParse(value).success;
  const business = await prisma.business.findFirst({
    where: isId ? { id: value } : { slug: value },
    include: {
      owner: { select: { id: true, name: true } },
      listing: { include: { category: true } },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!business) {
    throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
  }
  const canViewPending =
    req.user?.role === Role.admin || (req.user?.id && req.user.id === business.ownerId);
  if (business.status !== BusinessStatus.active && !canViewPending) {
    throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
  }
  res.json({ business });
});

businessesRouter.post("/", requireRole(Role.business, Role.admin), async (req, res) => {
  const data = createSchema.parse(req.body);
  const {
    categoryId,
    title,
    description,
    address,
    city,
    lat,
    lng,
    hours,
    images,
    website,
    featured,
    ...businessData
  } = data;
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist");
  }
  const slug = await availableSlug(data.slug ?? slugify(data.name));
  const business = await prisma.$transaction(async (tx) =>
    tx.business.create({
      data: {
        ...businessData,
        slug,
        ownerId: req.user!.id,
        status: req.user!.role === Role.admin ? BusinessStatus.active : BusinessStatus.pending,
        listing: {
          create: {
            categoryId,
            title,
            description,
            address,
            city,
            lat,
            lng,
            hours,
            images,
            website,
            featured: req.user!.role === Role.admin ? featured : false,
          },
        },
      },
      include: { listing: { include: { category: true } } },
    }),
  );
  res.status(201).json({ business });
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  logoUrl: httpUrl.nullable().optional(),
  categoryId: listingFields.categoryId.optional(),
  title: listingFields.title.optional(),
  description: listingFields.description.optional(),
  address: listingFields.address.optional(),
  city: listingFields.city.optional(),
  lat: listingFields.lat.nullable().optional(),
  lng: listingFields.lng.nullable().optional(),
  hours: hoursSchema.nullable().optional(),
  images: z.array(httpUrl).max(20).optional(),
  website: httpUrl.nullable().optional(),
  verified: z.boolean().optional(),
  status: z.nativeEnum(BusinessStatus).optional(),
  featured: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one field is required");

businessesRouter.patch("/:id", requireRole(Role.business, Role.admin), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateSchema.parse(req.body);
  const existing = await prisma.business.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing) {
    throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
  }
  if (req.user!.role !== Role.admin && existing.ownerId !== req.user!.id) {
    throw new ApiError(403, "NOT_OWNER", "Only the business owner can update this business");
  }
  if (req.user!.role !== Role.admin && (data.verified !== undefined || data.status !== undefined || data.featured !== undefined)) {
    throw new ApiError(403, "ADMIN_FIELDS", "Only administrators can change verification, status, or featured state");
  }
  if (data.categoryId && !(await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }))) {
    throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist");
  }

  const businessKeys = ["name", "email", "phone", "logoUrl", "verified", "status"] as const;
  const businessData = Object.fromEntries(
    businessKeys.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]),
  );
  const listingKeys = ["categoryId", "title", "description", "address", "city", "lat", "lng", "hours", "images", "website", "featured"] as const;
  const listingData = Object.fromEntries(
    listingKeys.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]),
  );
  const business = await prisma.business.update({
    where: { id },
    data: {
      ...businessData,
      ...(Object.keys(listingData).length ? { listing: { update: listingData } } : {}),
    },
    include: { listing: { include: { category: true } } },
  });
  res.json({ business });
});
