import { BusinessStatus, Role, AutomotiveEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isAutomotiveServiceCategorySlug } from "../../shared/domain/automotive.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { automotiveEnquiriesRepository } from "./automotive-enquiries.repository.js";
import type {
  AutomotiveEnquiryListQuery,
  CreateAutomotiveEnquiryInput,
  UpdateAutomotiveEnquiryInput,
} from "./automotive-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function automotiveSlugsOf(business: {
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

export const automotiveEnquiriesService = {
  async create(
    input: CreateAutomotiveEnquiryInput,
    user?: AuthUser,
    ctx?: { ip?: string; requestId?: string },
  ) {
    const business = await automotiveEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This automotive provider is not available");
    }
    if (!automotiveSlugsOf(business).some(isAutomotiveServiceCategorySlug)) {
      throw new ApiError(
        400,
        "NOT_AUTOMOTIVE",
        "Enquiries of this type are only for automotive service listings",
      );
    }

    const requestedIds = [...new Set(input.serviceSelections.map((row) => row.serviceId))];
    const services = await automotiveEnquiriesRepository.findApprovedServices(business.id, requestedIds);
    if (services.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_SERVICES", "One or more selected services are not available");
    }
    const servicesById = new Map(services.map((item) => [item.id, item]));
    const serviceSelections = input.serviceSelections.map((row) => ({
      serviceId: row.serviceId,
      name: servicesById.get(row.serviceId)?.name ?? "Service",
      quantity: row.quantity,
    }));

    const enquiry = await automotiveEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      preferredDate: parseDateOnly(input.preferredDate),
      preferredTime: input.preferredTime,
      vehicleInfo: input.vehicleInfo,
      notes: input.notes,
      serviceSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "automotive_enquiry.create",
      entityType: "automotive_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const serviceLines = serviceSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New automotive enquiry for ${business.name}`,
        body: [
          `A customer requested an automotive service from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Preferred: ${input.preferredDate}${input.preferredTime ? ` at ${input.preferredTime}` : ""}`,
          input.vehicleInfo ? `Vehicle: ${input.vehicleInfo}` : null,
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

  async listForActor(query: AutomotiveEnquiryListQuery, user: AuthUser) {
    const where: Prisma.AutomotiveEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      automotiveEnquiriesRepository.list(where, skip, query.pageSize),
      automotiveEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateAutomotiveEnquiryInput, user: AuthUser) {
    const existing = await automotiveEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Automotive enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return automotiveEnquiriesRepository.update(id, {
      status: input.status as AutomotiveEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
