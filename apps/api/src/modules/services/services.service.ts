import { BusinessStatus, Role, ServiceApprovalStatus } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import type { AuthUser } from "../../shared/domain/business.js";
import {
  normalizeAndValidateFieldValues,
  serializeFieldValue,
} from "../../shared/domain/category-fields.js";
import { formSchemaVersion } from "../../shared/domain/composed-forms.js";
import { assetsService } from "../assets/assets.service.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import { servicesRepository } from "./services.repository.js";
import type { CreateServiceInput, UpdateServiceInput } from "./services.schemas.js";

function assertOwner(ownerId: string, user: AuthUser) {
  if (user.role !== Role.admin && user.id !== ownerId) {
    throw new ApiError(403, "NOT_OWNER", "Only the business owner can manage services");
  }
}

async function persistServiceFields(
  service: { id: string; categoryId: string | null; businessId: string },
  fieldValues: CreateServiceInput["fieldValues"],
  requireRequired: boolean,
) {
  const resolvedCategoryId =
    service.categoryId ?? (await servicesRepository.findBusinessCategoryId(service.businessId));
  if (!resolvedCategoryId) return 1;

  const fields = await categoriesRepository.listComposedFields(resolvedCategoryId, {
    kind: "listing",
    activeOnly: true,
  });
  if (!fields.length) return 1;

  const normalized = normalizeAndValidateFieldValues(fields, fieldValues ?? [], { requireRequired });
  if (normalized.length) {
    await categoriesRepository.upsertServiceValues(service.id, normalized);
  }
  return formSchemaVersion(fields);
}

async function withFieldValues<T extends { id: string }>(services: T[]) {
  return Promise.all(
    services.map(async (service) => {
      const fieldValues = (await categoriesRepository.listServiceValues(service.id)).map(
        serializeFieldValue,
      );
      return { ...service, fieldValues };
    }),
  );
}

export const servicesService = {
  async listForBusiness(businessId: string, user?: AuthUser) {
    const business = await servicesRepository.findBusinessOwner(businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    const publicOnly = !(user && (user.role === Role.admin || user.id === business.ownerId));
    const services = await servicesRepository.listByBusiness(businessId, { publicOnly });
    return withFieldValues(services);
  },

  async create(input: CreateServiceInput, user: AuthUser) {
    const business = await servicesRepository.findBusinessOwner(input.businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    assertOwner(business.ownerId, user);
    const canCreate =
      user.role === Role.admin ||
      business.status === BusinessStatus.active ||
      business.status === BusinessStatus.pending;
    if (!canCreate) {
      throw new ApiError(
        403,
        "BUSINESS_NOT_ACTIVE",
        business.status === BusinessStatus.suspended
          ? "This business is disabled by admin"
          : "This business cannot accept new listings",
      );
    }
    const { fieldValues, ...data } = input;
    const categoryId = data.categoryId ?? (await servicesRepository.findBusinessCategoryId(input.businessId));
    if (categoryId && !(await categoriesRepository.categoryIsAssignable(categoryId))) {
      throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist or is not available");
    }
    const approvalStatus =
      user.role === Role.admin ? ServiceApprovalStatus.approved : ServiceApprovalStatus.pending;
    const service = await servicesRepository.create({
      ...data,
      categoryId: categoryId ?? undefined,
      approvalStatus,
      formSchemaVersion: 1,
    });
    if (input.images?.length) {
      await assetsService.dualWriteUrlList({
        urls: input.images,
        uploadedById: user.id,
        entityType: "service",
        entityId: service.id,
        purpose: "gallery",
      });
    }
    const schemaVersion = await persistServiceFields(service, fieldValues, true);
    const updated =
      schemaVersion === 1
        ? service
        : await servicesRepository.update(service.id, { formSchemaVersion: schemaVersion });
    const [hydrated] = await withFieldValues([updated]);
    return hydrated;
  },

  async update(id: string, input: UpdateServiceInput, user: AuthUser) {
    const existing = await servicesRepository.findById(id);
    if (!existing) throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found");
    assertOwner(existing.business.ownerId, user);
    const { fieldValues, ...data } = input;
    if (data.categoryId && !(await categoriesRepository.categoryIsAssignable(data.categoryId))) {
      throw new ApiError(400, "INVALID_CATEGORY", "Category does not exist or is not available");
    }
    const service = await servicesRepository.update(id, data);
    if (input.images) {
      await assetsService.dualWriteUrlList({
        urls: input.images,
        uploadedById: user.id,
        entityType: "service",
        entityId: service.id,
        purpose: "gallery",
      });
    }
    if (fieldValues) {
      const schemaVersion = await persistServiceFields(service, fieldValues, false);
      await servicesRepository.update(service.id, { formSchemaVersion: schemaVersion });
    }
    const [hydrated] = await withFieldValues([service]);
    return hydrated;
  },

  async remove(id: string, user: AuthUser) {
    const existing = await servicesRepository.findById(id);
    if (!existing) throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found");
    assertOwner(existing.business.ownerId, user);
    await servicesRepository.remove(id);
  },
};
