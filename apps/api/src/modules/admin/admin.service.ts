import { BusinessStatus, Role } from "@prisma/client";
import { assignRoleByKey } from "../../shared/auth/rbac.service.js";
import { ROLE_KEYS, type RoleKey } from "../../shared/auth/permissions.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { ApiError } from "../../shared/errors/index.js";
import { getEnv } from "../../config/env.js";
import { prisma } from "../../shared/db/prisma.js";
import { paginate } from "../../shared/utils/index.js";
import { urlForStorageKey } from "../assets/assets.repository.js";
import { adminRepository } from "./admin.repository.js";
import type { z } from "zod";
import type {
  adminAssetListSchema,
  adminAssignRoleSchema,
  adminAuditListSchema,
  adminListSchema,
  adminUpdateSchema,
  adminUserListSchema,
  adminUserPatchSchema,
} from "./admin.schemas.js";

type ListInput = z.infer<typeof adminListSchema>;
type UpdateInput = z.infer<typeof adminUpdateSchema>;
type UserListInput = z.infer<typeof adminUserListSchema>;
type UserPatchInput = z.infer<typeof adminUserPatchSchema>;
type AssignRoleInput = z.infer<typeof adminAssignRoleSchema>;
type AuditListInput = z.infer<typeof adminAuditListSchema>;
type AssetListInput = z.infer<typeof adminAssetListSchema>;

const STAFF_ROLE_KEYS = new Set<string>([
  ROLE_KEYS.SUPER_ADMIN,
  ROLE_KEYS.MODERATOR,
  ROLE_KEYS.SUPPORT_AGENT,
  ROLE_KEYS.CATEGORY_MANAGER,
  ROLE_KEYS.SERVICE_PROVIDER,
  ROLE_KEYS.CONSUMER,
]);

function legacyRoleForRoleKey(roleKey: string): Role | null {
  if (roleKey === ROLE_KEYS.SUPER_ADMIN) return Role.admin;
  if (roleKey === ROLE_KEYS.SERVICE_PROVIDER) return Role.business;
  if (roleKey === ROLE_KEYS.CONSUMER) return Role.user;
  return null;
}

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
      ...(Object.keys(listingPatch).length ? { listing: { update: listingPatch } } : {}),
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

  async listUsers(query: UserListInput) {
    const [items, total] = await adminRepository.listUsers(query);
    return {
      items: items.map((user) => ({
        ...user,
        roles: user.userRoles.map((row) => row.role),
        userRoles: undefined,
      })),
      pagination: paginate(total, query.page, query.pageSize),
    };
  },

  async patchUser(
    id: string,
    input: UserPatchInput,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    if (id === ctx.actorId && input.disabled) {
      throw new ApiError(400, "CANNOT_DISABLE_SELF", "You cannot disable your own account");
    }
    const existing = await adminRepository.findUser(id);
    if (!existing) throw new ApiError(404, "USER_NOT_FOUND", "User not found");

    if (input.disabled !== undefined) {
      await adminRepository.setUserDisabled(id, input.disabled);
    }

    await writeAuditLog({
      actorId: ctx.actorId,
      action: input.disabled ? "admin.user.disable" : "admin.user.enable",
      entityType: "user",
      entityId: id,
      meta: input,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });

    const refreshed = await adminRepository.findUser(id);
    return {
      ...refreshed!,
      roles: refreshed!.userRoles.map((row) => row.role),
      userRoles: undefined,
    };
  },

  async listRoles() {
    const roles = await adminRepository.listRoleDefs();
    return {
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role._count.userRoles,
        permissions: role.rolePermissions.map((row) => row.permission.key),
      })),
    };
  },

  async assignRole(
    userId: string,
    input: AssignRoleInput,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    if (!STAFF_ROLE_KEYS.has(input.roleKey)) {
      throw new ApiError(400, "UNKNOWN_ROLE", "Unknown role key");
    }
    const user = await adminRepository.findUser(userId);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    const role = await adminRepository.findRoleDefByKey(input.roleKey);
    if (!role) throw new ApiError(404, "ROLE_NOT_FOUND", "Role definition not found");

    await assignRoleByKey(userId, input.roleKey as RoleKey, { assignedById: ctx.actorId });

    const legacy = legacyRoleForRoleKey(input.roleKey);
    if (legacy) {
      await prisma.user.update({ where: { id: userId }, data: { role: legacy } });
    }

    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.user.assign_role",
      entityType: "user",
      entityId: userId,
      meta: { roleKey: input.roleKey },
      ip: ctx.ip,
      requestId: ctx.requestId,
    });

    const refreshed = await adminRepository.findUser(userId);
    return {
      ...refreshed!,
      roles: refreshed!.userRoles.map((row) => row.role),
      userRoles: undefined,
    };
  },

  async removeRole(
    userId: string,
    roleKey: string,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const user = await adminRepository.findUser(userId);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    const role = await adminRepository.findRoleDefByKey(roleKey);
    if (!role) throw new ApiError(404, "ROLE_NOT_FOUND", "Role definition not found");

    await adminRepository.removeUserRole(userId, role.id);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.user.remove_role",
      entityType: "user",
      entityId: userId,
      meta: { roleKey },
      ip: ctx.ip,
      requestId: ctx.requestId,
    });

    const refreshed = await adminRepository.findUser(userId);
    return {
      ...refreshed!,
      roles: refreshed!.userRoles.map((row) => row.role),
      userRoles: undefined,
    };
  },

  async listAudit(query: AuditListInput) {
    const [items, total] = await adminRepository.listAudit(query);
    return { items, pagination: paginate(total, query.page, query.pageSize) };
  },

  async listAssets(query: AssetListInput) {
    const [items, total] = await adminRepository.listAssets(query);
    return {
      items: items.map((asset) => ({
        ...asset,
        url: urlForStorageKey(asset.storageKey, asset.visibility),
      })),
      pagination: paginate(total, query.page, query.pageSize),
    };
  },

  stats() {
    return adminRepository.stats();
  },

  settings() {
    const env = getEnv();
    return {
      nodeEnv: env.NODE_ENV,
      cookieSecure: env.COOKIE_SECURE,
      rateLimitEnabled: env.RATE_LIMIT_ENABLED || env.NODE_ENV === "production",
      requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION || env.NODE_ENV === "production",
      runSeed: env.RUN_SEED,
      corsOrigins: env.corsOrigins,
      logLevel: env.LOG_LEVEL,
    };
  },
};
