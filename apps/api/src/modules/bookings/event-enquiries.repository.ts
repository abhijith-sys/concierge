import { Prisma, EventEnquiryStatus } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

const enquiryInclude = {
  business: { select: { id: true, name: true, slug: true, email: true, phone: true, ownerId: true } },
  listing: { select: { id: true, title: true, city: true } },
  user: { select: { id: true, name: true, email: true } },
} as const;

const categorySelect = {
  slug: true,
  parent: { select: { slug: true, parent: { select: { slug: true } } } },
} as const;

export const eventEnquiriesRepository = {
  findBusinessForEnquiry(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        ownerId: true,
        status: true,
        listing: {
          select: {
            id: true,
            title: true,
            category: { select: categorySelect },
          },
        },
      },
    });
  },

  findApprovedPackages(businessId: string, serviceIds: string[]) {
    return prisma.service.findMany({
      where: {
        businessId,
        id: { in: serviceIds },
        isActive: true,
        approvalStatus: "approved",
      },
      select: { id: true, name: true },
    });
  },

  create(data: Prisma.EventEnquiryCreateInput) {
    return prisma.eventEnquiry.create({ data, include: enquiryInclude });
  },

  findById(id: string) {
    return prisma.eventEnquiry.findUnique({ where: { id }, include: enquiryInclude });
  },

  list(where: Prisma.EventEnquiryWhereInput, skip: number, take: number) {
    return prisma.eventEnquiry.findMany({
      where,
      include: enquiryInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  count(where: Prisma.EventEnquiryWhereInput) {
    return prisma.eventEnquiry.count({ where });
  },

  update(id: string, data: { status?: EventEnquiryStatus; ownerNote?: string | null }) {
    return prisma.eventEnquiry.update({ where: { id }, data, include: enquiryInclude });
  },
};
