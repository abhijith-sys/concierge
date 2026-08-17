import type { AssetStatus, AssetVisibility, BusinessStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";
import { excludeInternalCategoryWhere } from "../categories/categories.repository.js";

export const adminRepository = {
  list(input: {
    q?: string;
    status?: BusinessStatus;
    categoryId?: string;
    verified?: boolean;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.BusinessWhereInput = {
      ...(input.status ? { status: input.status } : { status: { not: "deleted" } }),
      ...(input.verified === undefined ? {} : { verified: input.verified }),
      ...(input.categoryId
        ? {
            listing: {
              category: {
                OR: [
                  { id: input.categoryId },
                  { parentId: input.categoryId },
                  { parent: { parentId: input.categoryId } },
                ],
              },
            },
          }
        : {}),
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
    const [businesses, services, users, kycQueue, assets, categories, subcategories, categoryKinds] = await Promise.all([
      prisma.business.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.service.groupBy({ by: ["approvalStatus"], _count: { _all: true } }),
      prisma.user.count(),
      prisma.verificationSubmission.count({ where: { status: "submitted" } }),
      prisma.asset.count({ where: { status: { not: "deleted" } } }),
      prisma.category.count({ where: { parentId: null, ...excludeInternalCategoryWhere } }),
      prisma.category.count({ where: { parentId: { not: null } } }),
      prisma.category.groupBy({
        by: ["kind"],
        where: excludeInternalCategoryWhere,
        _count: { _all: true },
      }),
    ]);
    const byStatus = Object.fromEntries(businesses.map((row) => [row.status, row._count._all]));
    const byApproval = Object.fromEntries(services.map((row) => [row.approvalStatus, row._count._all]));
    const listingTotal = services.reduce((sum, row) => sum + row._count._all, 0);
    const providerTotal = businesses.reduce((sum, row) => sum + row._count._all, 0);
    const byKind = Object.fromEntries(categoryKinds.map((row) => [row.kind, row._count._all]));
    return {
      businesses: {
        pending: byStatus.pending ?? 0,
        active: byStatus.active ?? 0,
        rejected: byStatus.rejected ?? 0,
        suspended: byStatus.suspended ?? 0,
        deleted: byStatus.deleted ?? 0,
      },
      listings: {
        total: listingTotal,
        pending: byApproval.pending ?? 0,
        approved: byApproval.approved ?? 0,
        rejected: byApproval.rejected ?? 0,
        draft: byApproval.draft ?? 0,
      },
      users,
      providers: providerTotal,
      pendingProviders: byStatus.pending ?? 0,
      pendingListings: byApproval.pending ?? 0,
      categories,
      subcategories,
      categoryKinds: {
        supplier: byKind.supplier ?? 0,
        service: byKind.service ?? 0,
      },
      kycQueue,
      assets,
    };
  },

  listListings(input: {
    q?: string;
    status?: import("@prisma/client").ServiceApprovalStatus;
    businessId?: string;
    categoryId?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.ServiceWhereInput = {
      ...(input.status ? { approvalStatus: input.status } : {}),
      ...(input.businessId ? { businessId: input.businessId } : {}),
      ...(input.categoryId
        ? {
            OR: [
              { categoryId: input.categoryId },
              { category: { parentId: input.categoryId } },
              { category: { parent: { parentId: input.categoryId } } },
            ],
          }
        : {}),
      ...(input.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" } },
              { description: { contains: input.q, mode: "insensitive" } },
              { business: { name: { contains: input.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          business: { select: { id: true, name: true, slug: true, status: true, ownerId: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.service.count({ where }),
    ]);
  },

  getListing(id: string) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        fieldValues: { include: { field: true } },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            ownerId: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  },

  removeListing(id: string) {
    return prisma.service.delete({ where: { id } });
  },

  updateListing(id: string, data: Prisma.ServiceUpdateInput) {
    return prisma.service.update({
      where: { id },
      data,
      include: {
        category: true,
        business: { select: { id: true, name: true, slug: true, status: true } },
      },
    });
  },
};
