import { BusinessStatus, Role, EventEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isEventServiceCategorySlug } from "../../shared/domain/events.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { eventEnquiriesRepository } from "./event-enquiries.repository.js";
import type {
  CreateEventEnquiryInput,
  EventEnquiryListQuery,
  UpdateEventEnquiryInput,
} from "./event-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function eventSlugsOf(business: {
  listing?: {
    category?: { slug: string; parent?: { slug: string; parent?: { slug: string } | null } | null } | null;
  } | null;
}) {
  const category = business.listing?.category;
  return [category?.slug, category?.parent?.slug, category?.parent?.parent?.slug].filter(Boolean) as string[];
}

function canManage(enquiry: { business: { ownerId: string } }, user: AuthUser) {
  return user.role === Role.admin || enquiry.business.ownerId === user.id;
}

export const eventEnquiriesService = {
  async create(input: CreateEventEnquiryInput, user?: AuthUser, ctx?: { ip?: string; requestId?: string }) {
    const business = await eventEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This event crew is not available");
    }
    if (!eventSlugsOf(business).some(isEventServiceCategorySlug)) {
      throw new ApiError(400, "NOT_AN_EVENT", "Enquiries of this type are only for event and lifestyle crews");
    }

    const requestedIds = [...new Set(input.packageSelections.map((row) => row.serviceId))];
    const packages = await eventEnquiriesRepository.findApprovedPackages(business.id, requestedIds);
    if (packages.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_PACKAGES", "One or more selected packages are not available");
    }
    const packagesById = new Map(packages.map((item) => [item.id, item]));
    const packageSelections = input.packageSelections.map((row) => ({
      serviceId: row.serviceId,
      name: packagesById.get(row.serviceId)?.name ?? "Package",
      quantity: row.quantity,
    }));

    const enquiry = await eventEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      eventDate: parseDateOnly(input.eventDate),
      eventTime: input.eventTime,
      venue: input.venue,
      guests: input.guests,
      notes: input.notes,
      packageSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "event_enquiry.create",
      entityType: "event_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const packageLines = packageSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New event enquiry for ${business.name}`,
        body: [
          `A customer requested an event from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Date: ${input.eventDate}${input.eventTime ? ` at ${input.eventTime}` : ""}`,
          `Venue: ${input.venue}`,
          `Guests: ${input.guests}`,
          "",
          "Packages:",
          packageLines,
          input.notes ? `\nNotes:\n${input.notes}` : null,
          "",
          `Reply to the customer directly. ${brand.name} does not sit in the middle of the booking.`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      });
    } catch {
      // Enquiry is already stored; email is best-effort.
    }

    return enquiry;
  },

  async listForActor(query: EventEnquiryListQuery, user: AuthUser) {
    const where: Prisma.EventEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      eventEnquiriesRepository.list(where, skip, query.pageSize),
      eventEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateEventEnquiryInput, user: AuthUser) {
    const existing = await eventEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Event enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return eventEnquiriesRepository.update(id, {
      status: input.status as EventEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
