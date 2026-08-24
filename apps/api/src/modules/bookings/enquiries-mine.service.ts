import { prisma } from "../../shared/db/prisma.js";
import type { MineEnquiriesQuery, MineEnquiryItem } from "./enquiries-mine.schemas.js";

const businessSelect = { id: true, name: true, slug: true } as const;

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export const enquiriesMineService = {
  async listForUser(userId: string, query: MineEnquiriesQuery) {
    const [
      stays,
      rentals,
      travels,
      events,
      logistics,
      education,
      health,
      professional,
      homeTrade,
      automotive,
      electronics,
    ] = await Promise.all([
      prisma.stayEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rentalEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.travelEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.eventEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.logisticsEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.educationEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.healthEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.professionalEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.homeTradeEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.automotiveEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.electronicsEnquiry.findMany({
        where: { userId },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items: MineEnquiryItem[] = [
      ...stays.map((row) => ({
        id: row.id,
        vertical: "stay" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}`,
      })),
      ...rentals.map((row) => ({
        id: row.id,
        vertical: "rental" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.hireFrom)} → ${formatDate(row.hireTo)}`,
      })),
      ...travels.map((row) => ({
        id: row.id,
        vertical: "travel" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.pickupDate)} · ${row.pickupLocation} → ${row.dropoffLocation}`,
      })),
      ...events.map((row) => ({
        id: row.id,
        vertical: "event" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.eventDate)} · ${row.venue}`,
      })),
      ...logistics.map((row) => ({
        id: row.id,
        vertical: "logistics" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.pickupDate)} · ${row.pickupLocation} → ${row.dropoffLocation}`,
      })),
      ...education.map((row) => ({
        id: row.id,
        vertical: "education" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.startDate)}${row.learningMode ? ` · ${row.learningMode}` : ""}`,
      })),
      ...health.map((row) => ({
        id: row.id,
        vertical: "health" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.appointmentDate)}${row.concern ? ` · ${row.concern}` : ""}`,
      })),
      ...professional.map((row) => ({
        id: row.id,
        vertical: "professional" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.preferredDate)}${row.topic ? ` · ${row.topic}` : ""}`,
      })),
      ...homeTrade.map((row) => ({
        id: row.id,
        vertical: "home_trade" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.preferredDate)} · ${row.jobLocation}`,
      })),
      ...automotive.map((row) => ({
        id: row.id,
        vertical: "automotive" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.preferredDate)}${row.vehicleInfo ? ` · ${row.vehicleInfo}` : ""}`,
      })),
      ...electronics.map((row) => ({
        id: row.id,
        vertical: "electronics" as const,
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.preferredDate)}${row.deviceInfo ? ` · ${row.deviceInfo}` : ""}`,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const skip = (query.page - 1) * query.pageSize;
    const pageItems = items.slice(skip, skip + query.pageSize);

    return {
      items: pageItems,
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },
};
