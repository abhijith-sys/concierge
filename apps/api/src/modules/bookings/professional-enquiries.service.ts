import { BusinessStatus, Role, ProfessionalEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isProfessionalServiceCategorySlug } from "../../shared/domain/professional.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { professionalEnquiriesRepository } from "./professional-enquiries.repository.js";
import type {
  CreateProfessionalEnquiryInput,
  ProfessionalEnquiryListQuery,
  UpdateProfessionalEnquiryInput,
} from "./professional-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function professionalSlugsOf(business: {
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

export const professionalEnquiriesService = {
  async create(
    input: CreateProfessionalEnquiryInput,
    user?: AuthUser,
    ctx?: { ip?: string; requestId?: string },
  ) {
    const business = await professionalEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This professional is not available");
    }
    if (!professionalSlugsOf(business).some(isProfessionalServiceCategorySlug)) {
      throw new ApiError(
        400,
        "NOT_PROFESSIONAL",
        "Enquiries of this type are only for professional and business service listings",
      );
    }

    const requestedIds = [...new Set(input.serviceSelections.map((row) => row.serviceId))];
    const services = await professionalEnquiriesRepository.findApprovedServices(business.id, requestedIds);
    if (services.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_SERVICES", "One or more selected services are not available");
    }
    const servicesById = new Map(services.map((item) => [item.id, item]));
    const serviceSelections = input.serviceSelections.map((row) => ({
      serviceId: row.serviceId,
      name: servicesById.get(row.serviceId)?.name ?? "Service",
      quantity: row.quantity,
    }));

    const enquiry = await professionalEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      preferredDate: parseDateOnly(input.preferredDate),
      preferredTime: input.preferredTime,
      topic: input.topic,
      notes: input.notes,
      serviceSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "professional_enquiry.create",
      entityType: "professional_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const serviceLines = serviceSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New professional enquiry for ${business.name}`,
        body: [
          `A customer requested a consultation from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Preferred: ${input.preferredDate}${input.preferredTime ? ` at ${input.preferredTime}` : ""}`,
          input.topic ? `Topic: ${input.topic}` : null,
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

  async listForActor(query: ProfessionalEnquiryListQuery, user: AuthUser) {
    const where: Prisma.ProfessionalEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      professionalEnquiriesRepository.list(where, skip, query.pageSize),
      professionalEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateProfessionalEnquiryInput, user: AuthUser) {
    const existing = await professionalEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Professional enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return professionalEnquiriesRepository.update(id, {
      status: input.status as ProfessionalEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
