import { Role } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import type { AuthUser } from "../../shared/domain/business.js";
import { servicesRepository } from "./services.repository.js";
import type { CreateServiceInput, UpdateServiceInput } from "./services.schemas.js";

function assertOwner(ownerId: string, user: AuthUser) {
  if (user.role !== Role.admin && user.id !== ownerId) {
    throw new ApiError(403, "NOT_OWNER", "Only the business owner can manage services");
  }
}

export const servicesService = {
  async listForBusiness(businessId: string, user?: AuthUser) {
    const business = await servicesRepository.findBusinessOwner(businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    const activeOnly = !(user && (user.role === Role.admin || user.id === business.ownerId));
    return servicesRepository.listByBusiness(businessId, activeOnly);
  },

  async create(input: CreateServiceInput, user: AuthUser) {
    const business = await servicesRepository.findBusinessOwner(input.businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    assertOwner(business.ownerId, user);
    return servicesRepository.create(input);
  },

  async update(id: string, input: UpdateServiceInput, user: AuthUser) {
    const existing = await servicesRepository.findById(id);
    if (!existing) throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found");
    assertOwner(existing.business.ownerId, user);
    return servicesRepository.update(id, input);
  },

  async remove(id: string, user: AuthUser) {
    const existing = await servicesRepository.findById(id);
    if (!existing) throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found");
    assertOwner(existing.business.ownerId, user);
    await servicesRepository.update(id, { isActive: false });
  },
};
