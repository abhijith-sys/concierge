import { prisma } from "../../shared/db/prisma.js";
import type { GuestEnquiryLookupItem, GuestEnquiryLookupQuery } from "./enquiries-guest-lookup.schemas.js";

const businessSelect = { id: true, name: true, slug: true } as const;

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const enquiriesGuestLookupService = {
  async lookup(query: GuestEnquiryLookupQuery) {
    const email = normalizeEmail(query.email);
    const refFilter = query.ref ? { id: query.ref } : {};

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
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.rentalEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.travelEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.eventEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.logisticsEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.educationEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.healthEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.professionalEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.homeTradeEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.automotiveEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
      prisma.electronicsEnquiry.findMany({
        where: { guestEmail: { equals: email, mode: "insensitive" }, ...refFilter },
        include: { business: { select: businessSelect } },
        orderBy: { createdAt: "desc" },
        take: query.ref ? 1 : 5,
      }),
    ]);

    const items: GuestEnquiryLookupItem[] = [
      ...stays.map((row) => ({
        id: row.id,
        vertical: "stay",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}`,
      })),
      ...rentals.map((row) => ({
        id: row.id,
        vertical: "rental",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.hireFrom)} → ${formatDate(row.hireTo)}`,
      })),
      ...travels.map((row) => ({
        id: row.id,
        vertical: "travel",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.pickupDate)} · ${row.pickupLocation}`,
      })),
      ...events.map((row) => ({
        id: row.id,
        vertical: "event",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.eventDate)} · ${row.venue}`,
      })),
      ...logistics.map((row) => ({
        id: row.id,
        vertical: "logistics",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: `${formatDate(row.pickupDate)} · ${row.pickupLocation}`,
      })),
      ...education.map((row) => ({
        id: row.id,
        vertical: "education",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: formatDate(row.startDate),
      })),
      ...health.map((row) => ({
        id: row.id,
        vertical: "health",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: formatDate(row.appointmentDate),
      })),
      ...professional.map((row) => ({
        id: row.id,
        vertical: "professional",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: formatDate(row.preferredDate),
      })),
      ...homeTrade.map((row) => ({
        id: row.id,
        vertical: "home_trade",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: formatDate(row.preferredDate),
      })),
      ...automotive.map((row) => ({
        id: row.id,
        vertical: "automotive",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: formatDate(row.preferredDate),
      })),
      ...electronics.map((row) => ({
        id: row.id,
        vertical: "electronics",
        status: row.status,
        createdAt: row.createdAt,
        business: row.business,
        summary: formatDate(row.preferredDate),
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, query.ref ? 1 : 5);

    return { items };
  },
};
