import { BusinessStatus, Role } from "@prisma/client";
import { z } from "zod";
import {
  assertCanViewBusiness,
  availableBusinessSlug,
  type AuthUser,
} from "../../shared/domain/business.js";
import { ApiError } from "../../shared/errors/index.js";
import { slugify } from "../../shared/utils/index.js";
import { businessesRepository } from "./businesses.repository.js";
import type { CreateBusinessInput, UpdateBusinessInput } from "./businesses.schemas.js";

export const businessesService = {
  async getBySlugOrId(slugOrId: string, user?: AuthUser) {
    const value = z.string().min(1).max(200).parse(slugOrId);
    const isId = z.string().uuid().safeParse(value).success;
    const business = await businessesRepository.findBySlugOrId(value, isId);
    assertCanViewBusiness(business, user);
    return business!;
  },

  async create(input: CreateBusinessInput, user: AuthUser) {
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
    } = input;

    if (!(await businessesRepository.categoryExists(categoryId))) {
      throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist");
    }

    const slug = await availableBusinessSlug(input.slug ?? slugify(input.name));
    return businessesRepository.create({
      ...businessData,
      slug,
      ownerId: user.id,
      status: user.role === Role.admin ? BusinessStatus.active : BusinessStatus.pending,
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
          featured: user.role === Role.admin ? featured : false,
        },
      },
    });
  },

  async update(id: string, input: UpdateBusinessInput, user: AuthUser) {
    const existing = await businessesRepository.findOwner(id);
    if (!existing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    }
    if (user.role !== Role.admin && existing.ownerId !== user.id) {
      throw new ApiError(403, "NOT_OWNER", "Only the business owner can update this business");
    }
    if (
      user.role !== Role.admin &&
      (input.verified !== undefined || input.status !== undefined || input.featured !== undefined)
    ) {
      throw new ApiError(
        403,
        "ADMIN_FIELDS",
        "Only administrators can change verification, status, or featured state",
      );
    }
    if (input.categoryId && !(await businessesRepository.categoryExists(input.categoryId))) {
      throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist");
    }

    const businessKeys = ["name", "email", "phone", "logoUrl", "verified", "status"] as const;
    const businessData = Object.fromEntries(
      businessKeys.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]),
    );
    const listingKeys = [
      "categoryId",
      "title",
      "description",
      "address",
      "city",
      "lat",
      "lng",
      "hours",
      "images",
      "website",
      "featured",
    ] as const;
    const listingData = Object.fromEntries(
      listingKeys.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]),
    );

    return businessesRepository.update(id, {
      ...businessData,
      ...(Object.keys(listingData).length ? { listing: { update: listingData } } : {}),
    });
  },
};
