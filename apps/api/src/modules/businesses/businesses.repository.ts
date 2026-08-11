import { prisma } from "../../shared/db/prisma.js";

const detailInclude = {
  owner: { select: { id: true, name: true } },
  listing: { include: { category: true } },
  reviews: {
    take: 5,
    orderBy: { createdAt: "desc" as const },
    include: { user: { select: { id: true, name: true } } },
  },
};

export const businessesRepository = {
  findBySlugOrId(value: string, isId: boolean) {
    return prisma.business.findFirst({
      where: isId ? { id: value } : { slug: value },
      include: detailInclude,
    });
  },

  findOwner(id: string) {
    return prisma.business.findUnique({ where: { id }, select: { ownerId: true } });
  },

  categoryExists(id: string) {
    return prisma.category.findUnique({ where: { id }, select: { id: true } });
  },

  create(data: Parameters<typeof prisma.business.create>[0]["data"]) {
    return prisma.business.create({
      data,
      include: { listing: { include: { category: true } } },
    });
  },

  update(id: string, data: Parameters<typeof prisma.business.update>[0]["data"]) {
    return prisma.business.update({
      where: { id },
      data,
      include: { listing: { include: { category: true } } },
    });
  },
};
