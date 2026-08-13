import { BusinessStatus, CategoryFieldScope, Role } from "@prisma/client";
import { z } from "zod";
import {
  assertCanViewBusiness,
  availableBusinessSlug,
  type AuthUser,
} from "../../shared/domain/business.js";
import {
  normalizeAndValidateFieldValues,
  serializeFieldValue,
} from "../../shared/domain/category-fields.js";
import { ApiError } from "../../shared/errors/index.js";
import { slugify } from "../../shared/utils/index.js";
import { assetsService } from "../assets/assets.service.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import { businessesRepository } from "./businesses.repository.js";
import type { CreateBusinessInput, UpdateBusinessInput } from "./businesses.schemas.js";

export const businessesService = {
  async getBySlugOrId(slugOrId: string, user?: AuthUser) {
    const value = z.string().min(1).max(200).parse(slugOrId);
    const isId = z.string().uuid().safeParse(value).success;
    const business = await businessesRepository.findBySlugOrId(value, isId);
    assertCanViewBusiness(business, user);
    const listingId = business!.listing?.id;
    const fieldValues = listingId
      ? (await categoriesRepository.listListingValues(listingId)).map(serializeFieldValue)
      : [];
    return { ...business!, fieldValues };
  },

  async listMine(user: AuthUser) {
    return businessesRepository.listMine(user.id);
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
      fieldValues,
      ...businessData
    } = input;

    if (!hours || Object.keys(hours).length === 0) {
      throw new ApiError(400, "HOURS_REQUIRED", "Business hours are required to submit a listing");
    }

    if (!(await businessesRepository.categoryExists(categoryId))) {
      throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist");
    }

    const listingFields = await categoriesRepository.listFields(categoryId, {
      activeOnly: true,
      scope: CategoryFieldScope.listing,
    });
    const normalized = normalizeAndValidateFieldValues(listingFields, fieldValues ?? [], {
      requireRequired: true,
    });

    const slug = await availableBusinessSlug(input.slug ?? slugify(input.name));
    const business = await businessesRepository.create({
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

    if (business.listing && normalized.length) {
      await categoriesRepository.upsertListingValues(business.listing.id, normalized);
    }

    await dualWriteBusinessMedia(business, user.id);
    return business;
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

    const businessKeys = [
      "name",
      "email",
      "phone",
      "logoUrl",
      "coverUrl",
      "socialLinks",
      "verified",
      "status",
    ] as const;
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

    const business = await businessesRepository.update(id, {
      ...businessData,
      ...(Object.keys(listingData).length ? { listing: { update: listingData } } : {}),
    });

    if (input.fieldValues && business.listing) {
      const categoryId = input.categoryId ?? business.listing.categoryId;
      const listingFields = await categoriesRepository.listFields(categoryId, {
        activeOnly: true,
        scope: CategoryFieldScope.listing,
      });
      const normalized = normalizeAndValidateFieldValues(listingFields, input.fieldValues, {
        requireRequired: false,
      });
      await categoriesRepository.upsertListingValues(business.listing.id, normalized);
    }

    await dualWriteBusinessMedia(business, user.id);
    return business;
  },
};

async function dualWriteBusinessMedia(
  business: {
    id: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    listing?: { id: string; images: string[] } | null;
  },
  uploadedById: string,
) {
  await assetsService.dualWriteUrl({
    url: business.logoUrl,
    uploadedById,
    entityType: "business",
    entityId: business.id,
    purpose: "logo",
  });
  await assetsService.dualWriteUrl({
    url: business.coverUrl,
    uploadedById,
    entityType: "business",
    entityId: business.id,
    purpose: "cover",
  });
  if (business.listing) {
    await assetsService.dualWriteUrlList({
      urls: business.listing.images ?? [],
      uploadedById,
      entityType: "listing",
      entityId: business.listing.id,
      purpose: "gallery",
    });
  }
}
