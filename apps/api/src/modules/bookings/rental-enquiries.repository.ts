import { Prisma, RentalEnquiryStatus } from "@prisma/client";
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

export const rentalEnquiriesRepository = {
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

  findApprovedItems(businessId: string, serviceIds: string[]) {
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

  create(data: Prisma.RentalEnquiryCreateInput) {
    return prisma.rentalEnquiry.create({ data, include: enquiryInclude });
  },

  findById(id: string) {
    return prisma.rentalEnquiry.findUnique({ where: { id }, include: enquiryInclude });
  },

  list(where: Prisma.RentalEnquiryWhereInput, skip: number, take: number) {
    return prisma.rentalEnquiry.findMany({
      where,
      include: enquiryInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  count(where: Prisma.RentalEnquiryWhereInput) {
    return prisma.rentalEnquiry.count({ where });
  },

  update(id: string, data: { status?: RentalEnquiryStatus; ownerNote?: string | null }) {
    return prisma.rentalEnquiry.update({ where: { id }, data, include: enquiryInclude });
  },
};
