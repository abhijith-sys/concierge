import { prisma } from "../../shared/db/prisma.js";
import type { ServiceApprovalStatus } from "@prisma/client";

export const servicesRepository = {
  listByBusiness(businessId: string, options: { publicOnly: boolean }) {
    return prisma.service.findMany({
      where: {
        businessId,
        ...(options.publicOnly
          ? { isActive: true, approvalStatus: "approved" }
          : {}),
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { category: true },
    });
  },

  findById(id: string) {
    return prisma.service.findUnique({
      where: { id },
      include: { business: { select: { id: true, ownerId: true } }, category: true },
    });
  },

  create(data: {
    businessId: string;
    categoryId?: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    pricingType?: string;
    durationMinutes?: number;
    images: string[];
    isActive: boolean;
    approvalStatus: ServiceApprovalStatus;
    formSchemaVersion: number;
  }) {
    return prisma.service.create({
      data: {
        ...data,
        price: data.price,
      },
      include: { category: true },
    });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.service.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  remove(id: string) {
    return prisma.service.delete({ where: { id } });
  },

  findBusinessOwner(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, status: true },
    });
  },

  async findBusinessCategoryId(businessId: string) {
    const row = await prisma.business.findUnique({
      where: { id: businessId },
      select: { listing: { select: { categoryId: true } } },
    });
    return row?.listing?.categoryId ?? null;
  },
};
