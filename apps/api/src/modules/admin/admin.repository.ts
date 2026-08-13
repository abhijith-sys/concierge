import type { AssetStatus, AssetVisibility, BusinessStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

export const adminRepository = {
  list(input: {
    q?: string;
    status?: BusinessStatus;
    verified?: boolean;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.BusinessWhereInput = {
      ...(input.status ? { status: input.status } : { status: { not: "deleted" } }),
      ...(input.verified === undefined ? {} : { verified: input.verified }),
      ...(input.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" } },
              { email: { contains: input.q, mode: "insensitive" } },
              { slug: { contains: input.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.business.findMany({
        where,
        include: {
          listing: { include: { category: true } },
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { services: true, reviews: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.business.count({ where }),
    ]);
  },

  getById(id: string) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        listing: { include: { category: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        services: true,
        verifications: { orderBy: { createdAt: "desc" }, take: 5 },
        reviews: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });
  },

  update(id: string, data: Prisma.BusinessUpdateInput) {
    return prisma.business.update({
      where: { id },
      data,
      include: { listing: { include: { category: true } } },
    });
  },

  hardDelete(id: string) {
    return prisma.business.delete({ where: { id } });
  },

  listUsers(input: {
    q?: string;
    role?: Role;
    disabled?: boolean;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(input.role ? { role: input.role } : {}),
      ...(input.disabled === undefined
        ? {}
        : input.disabled
          ? { disabledAt: { not: null } }
          : { disabledAt: null }),
      ...(input.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" } },
              { email: { contains: input.q, mode: "insensitive" } },
              { phone: { contains: input.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          mfaEnabled: true,
          disabledAt: true,
          emailVerifiedAt: true,
          createdAt: true,
          userRoles: { include: { role: { select: { id: true, key: true, name: true } } } },
          _count: { select: { businesses: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.user.count({ where }),
    ]);
  },

  findUser(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mfaEnabled: true,
        disabledAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        userRoles: { include: { role: true } },
      },
    });
  },

  setUserDisabled(id: string, disabled: boolean) {
    return prisma.user.update({
      where: { id },
      data: { disabledAt: disabled ? new Date() : null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabledAt: true,
        userRoles: { include: { role: { select: { id: true, key: true, name: true } } } },
      },
    });
  },

  listRoleDefs() {
    return prisma.roleDef.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  },

  findRoleDefByKey(key: string) {
    return prisma.roleDef.findUnique({ where: { key } });
  },

  removeUserRole(userId: string, roleId: string) {
    return prisma.userRole.deleteMany({ where: { userId, roleId } });
  },

  listAudit(input: {
    q?: string;
    entityType?: string;
    actorId?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.actorId ? { actorId: input.actorId } : {}),
      ...(input.q
        ? {
            OR: [
              { action: { contains: input.q, mode: "insensitive" } },
              { entityType: { contains: input.q, mode: "insensitive" } },
              { entityId: { contains: input.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
  },

  listAssets(input: {
    visibility?: AssetVisibility;
    status?: AssetStatus;
    q?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.AssetWhereInput = {
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(input.status ? { status: input.status } : { status: { not: "deleted" } }),
      ...(input.q
        ? {
            OR: [
              { storageKey: { contains: input.q, mode: "insensitive" } },
              { mimeType: { contains: input.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.asset.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          attachments: {
            select: { id: true, entityType: true, entityId: true, purpose: true },
            take: 10,
          },
          _count: { select: { attachments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.asset.count({ where }),
    ]);
  },

  async stats() {
    const [businesses, users, kycQueue, assets] = await Promise.all([
      prisma.business.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.count(),
      prisma.verificationSubmission.count({ where: { status: "submitted" } }),
      prisma.asset.count({ where: { status: { not: "deleted" } } }),
    ]);
    const byStatus = Object.fromEntries(businesses.map((row) => [row.status, row._count._all]));
    return {
      businesses: {
        pending: byStatus.pending ?? 0,
        active: byStatus.active ?? 0,
        suspended: byStatus.suspended ?? 0,
        deleted: byStatus.deleted ?? 0,
      },
      users,
      kycQueue,
      assets,
    };
  },
};
