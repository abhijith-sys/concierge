import { Prisma, StayEnquiryStatus } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

const enquiryInclude = {
  business: { select: { id: true, name: true, slug: true, email: true, phone: true, ownerId: true } },
  listing: { select: { id: true, title: true, city: true } },
  user: { select: { id: true, name: true, email: true } },
} as const;

export const stayEnquiriesRepository = {
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
            category: { select: { slug: true, parent: { select: { slug: true } } } },
          },
        },
      },
    });
  },

  findApprovedRooms(businessId: string, serviceIds: string[]) {
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

  create(data: Prisma.StayEnquiryCreateInput) {
    return prisma.stayEnquiry.create({ data, include: enquiryInclude });
  },

  findById(id: string) {
    return prisma.stayEnquiry.findUnique({ where: { id }, include: enquiryInclude });
  },

  list(where: Prisma.StayEnquiryWhereInput, skip: number, take: number) {
    return prisma.stayEnquiry.findMany({
      where,
      include: enquiryInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  count(where: Prisma.StayEnquiryWhereInput) {
    return prisma.stayEnquiry.count({ where });
  },

  update(id: string, data: { status?: StayEnquiryStatus; ownerNote?: string | null }) {
    return prisma.stayEnquiry.update({ where: { id }, data, include: enquiryInclude });
  },
};
