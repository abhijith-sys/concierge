import { prisma } from "../../shared/db/prisma.js";

export const verificationRepository = {
  findBusiness(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, status: true, verified: true },
    });
  },

  findDraft(businessId: string) {
    return prisma.verificationSubmission.findFirst({
      where: { businessId, status: { in: ["draft", "rejected"] } },
      orderBy: { createdAt: "desc" },
    });
  },

  findLatest(businessId: string) {
    return prisma.verificationSubmission.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: Record<string, unknown>) {
    return prisma.verificationSubmission.create({ data: data as never });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.verificationSubmission.update({ where: { id }, data: data as never });
  },

  findById(id: string) {
    return prisma.verificationSubmission.findUnique({
      where: { id },
      include: { business: { select: { id: true, ownerId: true, name: true } } },
    });
  },

  listQueue(page: number, pageSize: number) {
    const where = { status: "submitted" as const };
    return prisma.$transaction([
      prisma.verificationSubmission.findMany({
        where,
        include: { business: { select: { id: true, name: true, slug: true, ownerId: true } } },
        orderBy: { submittedAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.verificationSubmission.count({ where }),
    ]);
  },
};
