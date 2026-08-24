import { BusinessStatus, Role, StayEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isStayCategorySlug } from "../../shared/domain/stays.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { stayEnquiriesRepository } from "./stay-enquiries.repository.js";
import type {
  CreateStayEnquiryInput,
  StayEnquiryListQuery,
  UpdateStayEnquiryInput,
} from "./stay-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function nightsBetween(checkIn: string, checkOut: string) {
  const start = parseDateOnly(checkIn).getTime();
  const end = parseDateOnly(checkOut).getTime();
  return Math.round((end - start) / 86_400_000);
}

function staySlugOf(business: {
  listing?: { category?: { slug: string; parent?: { slug: string } | null } | null } | null;
}) {
  return business.listing?.category?.slug ?? business.listing?.category?.parent?.slug ?? null;
}

function canManage(enquiry: { business: { ownerId: string } }, user: AuthUser) {
  return user.role === Role.admin || enquiry.business.ownerId === user.id;
}

export const stayEnquiriesService = {
  async create(
    input: CreateStayEnquiryInput,
    user?: AuthUser,
    ctx?: { ip?: string; requestId?: string },
  ) {
    const business = await stayEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This stay is not available");
    }
    const categorySlug = staySlugOf(business);
    const parentSlug = business.listing.category?.parent?.slug;
    if (!isStayCategorySlug(categorySlug) && !isStayCategorySlug(parentSlug)) {
      throw new ApiError(400, "NOT_A_STAY", "Enquiries of this type are only for hotels, resorts, and stays");
    }

    const requestedIds = [...new Set(input.roomSelections.map((row) => row.serviceId))];
    const rooms = await stayEnquiriesRepository.findApprovedRooms(business.id, requestedIds);
    if (rooms.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_ROOMS", "One or more selected rooms are not available");
    }
    const roomsById = new Map(rooms.map((room) => [room.id, room]));
    const roomSelections = input.roomSelections.map((row) => ({
      serviceId: row.serviceId,
      name: roomsById.get(row.serviceId)?.name ?? "Room",
      quantity: row.quantity,
    }));

    const enquiry = await stayEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      checkIn: parseDateOnly(input.checkIn),
      checkOut: parseDateOnly(input.checkOut),
      adults: input.adults,
      children: input.children,
      notes: input.notes,
      roomSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "stay_enquiry.create",
      entityType: "stay_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const nights = nightsBetween(input.checkIn, input.checkOut);
    const roomLines = roomSelections
      .map((row) => `- ${row.name} × ${row.quantity}`)
      .join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New stay enquiry for ${business.name}`,
        body: [
          `A guest requested a stay at ${business.name}.`,
          "",
          `Guest: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Dates: ${input.checkIn} → ${input.checkOut} (${nights} night${nights === 1 ? "" : "s"})`,
          `Guests: ${input.adults} adult${input.adults === 1 ? "" : "s"}, ${input.children} child${input.children === 1 ? "" : "ren"}`,
          "",
          "Rooms / cottages:",
          roomLines,
          input.notes ? `\nNotes:\n${input.notes}` : null,
          "",
          `Reply to the guest directly. ${brand.name} does not sit in the middle of the booking.`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      });
    } catch {
      // Enquiry is already stored; email is best-effort.
    }

    return enquiry;
  },

  async listForActor(query: StayEnquiryListQuery, user: AuthUser) {
    const where: Prisma.StayEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      stayEnquiriesRepository.list(where, skip, query.pageSize),
      stayEnquiriesRepository.count(where),
    ]);
    return {
      items,
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async update(id: string, input: UpdateStayEnquiryInput, user: AuthUser) {
    const existing = await stayEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Stay enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return stayEnquiriesRepository.update(id, {
      status: input.status as StayEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
