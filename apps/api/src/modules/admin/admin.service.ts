import { BusinessStatus } from "@prisma/client";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { ApiError } from "../../shared/errors/index.js";
import { paginate } from "../../shared/utils/index.js";
import { adminRepository } from "./admin.repository.js";
import type { z } from "zod";
import type { adminListSchema, adminUpdateSchema } from "./admin.schemas.js";

type ListInput = z.infer<typeof adminListSchema>;
type UpdateInput = z.infer<typeof adminUpdateSchema>;

export const adminService = {
  async list(query: ListInput) {
    const [items, total] = await adminRepository.list(query);
    return { items, pagination: paginate(total, query.page, query.pageSize) };
  },

  async get(id: string) {
    const business = await adminRepository.getById(id);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    return business;
  },

  async update(
    id: string,
    input: UpdateInput,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const existing = await adminRepository.getById(id);
    if (!existing) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");

    const listingPatch: Record<string, unknown> = {};
    if (input.description !== undefined) listingPatch.description = input.description;
    if (input.address !== undefined) listingPatch.address = input.address;
    if (input.city !== undefined) listingPatch.city = input.city;
    if (input.featured !== undefined) listingPatch.featured = input.featured;

    const business = await adminRepository.update(id, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      verified: input.verified,
      status: input.status,
      ...(Object.keys(listingPatch).length
        ? { listing: { update: listingPatch } }
        : {}),
    });

    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.business.update",
      entityType: "business",
      entityId: id,
      meta: input,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return business;
  },

  async setStatus(
    id: string,
    status: BusinessStatus,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const business = await adminRepository.update(id, { status });
    await writeAuditLog({
      actorId: ctx.actorId,
      action: `admin.business.${status}`,
      entityType: "business",
      entityId: id,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return business;
  },

  async remove(
    id: string,
    hard: boolean,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    if (hard) {
      await adminRepository.hardDelete(id);
      await writeAuditLog({
        actorId: ctx.actorId,
        action: "admin.business.hard_delete",
        entityType: "business",
        entityId: id,
        ip: ctx.ip,
        requestId: ctx.requestId,
      });
      return;
    }
    await this.setStatus(id, BusinessStatus.deleted, ctx);
  },
};
