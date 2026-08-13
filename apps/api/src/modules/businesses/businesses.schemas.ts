import { BusinessStatus } from "@prisma/client";
import { z } from "zod";

const mediaUrl = z.string().min(1).max(500).refine((value) => {
  if (value.startsWith("/uploads/")) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Only HTTP(S) or /uploads paths are allowed");

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time format");
export const hoursSchema = z.record(z.string(), z.tuple([time, time]).nullable());

const socialLinksSchema = z
  .object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  })
  .partial()
  .optional();

export const listingFields = {
  categoryId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(10_000),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  hours: hoursSchema.optional(),
  images: z.array(mediaUrl).max(20).default([]),
  website: mediaUrl.optional(),
  featured: z.boolean().optional(),
  fieldValues: z
    .array(
      z
        .object({
          fieldId: z.string().uuid().optional(),
          key: z.string().min(1).max(80).optional(),
          value: z.unknown(),
        })
        .refine((v) => Boolean(v.fieldId || v.key), "fieldId or key is required"),
    )
    .max(100)
    .optional(),
};

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(180)
    .optional(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30).optional(),
  logoUrl: mediaUrl.optional(),
  coverUrl: mediaUrl.optional(),
  socialLinks: socialLinksSchema,
  ...listingFields,
});

export const updateBusinessSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    email: z.string().trim().email().max(254).optional(),
    phone: z.string().trim().min(7).max(30).nullable().optional(),
    logoUrl: mediaUrl.nullable().optional(),
    coverUrl: mediaUrl.nullable().optional(),
    socialLinks: socialLinksSchema.nullable().optional(),
    categoryId: listingFields.categoryId.optional(),
    title: listingFields.title.optional(),
    description: listingFields.description.optional(),
    address: listingFields.address.optional(),
    city: listingFields.city.optional(),
    lat: listingFields.lat.nullable().optional(),
    lng: listingFields.lng.nullable().optional(),
    hours: hoursSchema.nullable().optional(),
    images: z.array(mediaUrl).max(20).optional(),
    website: mediaUrl.nullable().optional(),
    verified: z.boolean().optional(),
    status: z.nativeEnum(BusinessStatus).optional(),
    featured: z.boolean().optional(),
    fieldValues: z
      .array(
        z
          .object({
            fieldId: z.string().uuid().optional(),
            key: z.string().min(1).max(80).optional(),
            value: z.unknown(),
          })
          .refine((v) => Boolean(v.fieldId || v.key), "fieldId or key is required"),
      )
      .max(100)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
