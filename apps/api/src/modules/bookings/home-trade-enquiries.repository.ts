import { Prisma, HomeTradeEnquiryStatus } from "@prisma/client";
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

export const homeTradeEnquiriesRepository = {
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

  findApprovedServices(businessId: string, serviceIds: string[]) {
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

  create(data: Prisma.HomeTradeEnquiryCreateInput) {
    return prisma.homeTradeEnquiry.create({ data, include: enquiryInclude });
  },

  findById(id: string) {
    return prisma.homeTradeEnquiry.findUnique({ where: { id }, include: enquiryInclude });
  },

  list(where: Prisma.HomeTradeEnquiryWhereInput, skip: number, take: number) {
    return prisma.homeTradeEnquiry.findMany({
      where,
      include: enquiryInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  count(where: Prisma.HomeTradeEnquiryWhereInput) {
    return prisma.homeTradeEnquiry.count({ where });
  },

  update(id: string, data: { status?: HomeTradeEnquiryStatus; ownerNote?: string | null }) {
    return prisma.homeTradeEnquiry.update({ where: { id }, data, include: enquiryInclude });
  },
};
