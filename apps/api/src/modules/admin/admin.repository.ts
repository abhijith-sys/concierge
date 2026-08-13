import type { BusinessStatus, Prisma } from "@prisma/client";
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
};
