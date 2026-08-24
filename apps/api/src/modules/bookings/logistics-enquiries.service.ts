import { BusinessStatus, Role, LogisticsEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isLogisticsServiceCategorySlug } from "../../shared/domain/logistics.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { logisticsEnquiriesRepository } from "./logistics-enquiries.repository.js";
import type {
  CreateLogisticsEnquiryInput,
  LogisticsEnquiryListQuery,
  UpdateLogisticsEnquiryInput,
} from "./logistics-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function logisticsSlugsOf(business: {
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

export const logisticsEnquiriesService = {
  async create(input: CreateLogisticsEnquiryInput, user?: AuthUser, ctx?: { ip?: string; requestId?: string }) {
    const business = await logisticsEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This logistics operator is not available");
    }
    if (!logisticsSlugsOf(business).some(isLogisticsServiceCategorySlug)) {
      throw new ApiError(400, "NOT_LOGISTICS", "Enquiries of this type are only for logistics and moving listings");
    }

    const requestedIds = [...new Set(input.serviceSelections.map((row) => row.serviceId))];
    const offerings = await logisticsEnquiriesRepository.findApprovedOfferings(business.id, requestedIds);
    if (offerings.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_SERVICES", "One or more selected services are not available");
    }
    const offeringsById = new Map(offerings.map((item) => [item.id, item]));
    const serviceSelections = input.serviceSelections.map((row) => ({
      serviceId: row.serviceId,
      name: offeringsById.get(row.serviceId)?.name ?? "Service",
      quantity: row.quantity,
    }));

    const enquiry = await logisticsEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      pickupDate: parseDateOnly(input.pickupDate),
      pickupTime: input.pickupTime,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation,
      packingRequired: input.packingRequired ?? false,
      notes: input.notes,
      serviceSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "logistics_enquiry.create",
      entityType: "logistics_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const serviceLines = serviceSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New logistics enquiry for ${business.name}`,
        body: [
          `A customer requested a move or shipment from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Pickup: ${input.pickupDate}${input.pickupTime ? ` at ${input.pickupTime}` : ""}`,
          `From: ${input.pickupLocation}`,
          `To: ${input.dropoffLocation}`,
          input.packingRequired ? "Packing requested: yes" : "Packing requested: no",
          "",
          "Services:",
          serviceLines,
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

  async listForActor(query: LogisticsEnquiryListQuery, user: AuthUser) {
    const where: Prisma.LogisticsEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      logisticsEnquiriesRepository.list(where, skip, query.pageSize),
      logisticsEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateLogisticsEnquiryInput, user: AuthUser) {
    const existing = await logisticsEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Logistics enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return logisticsEnquiriesRepository.update(id, {
      status: input.status as LogisticsEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
