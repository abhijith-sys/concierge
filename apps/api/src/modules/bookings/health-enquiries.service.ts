import { BusinessStatus, Role, HealthEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isHealthServiceCategorySlug } from "../../shared/domain/health.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { healthEnquiriesRepository } from "./health-enquiries.repository.js";
import type {
  CreateHealthEnquiryInput,
  HealthEnquiryListQuery,
  UpdateHealthEnquiryInput,
} from "./health-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function healthSlugsOf(business: {
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

export const healthEnquiriesService = {
  async create(input: CreateHealthEnquiryInput, user?: AuthUser, ctx?: { ip?: string; requestId?: string }) {
    const business = await healthEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This health provider is not available");
    }
    if (!healthSlugsOf(business).some(isHealthServiceCategorySlug)) {
      throw new ApiError(400, "NOT_HEALTH", "Enquiries of this type are only for health and wellness listings");
    }

    const requestedIds = [...new Set(input.serviceSelections.map((row) => row.serviceId))];
    const services = await healthEnquiriesRepository.findApprovedServices(business.id, requestedIds);
    if (services.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_SERVICES", "One or more selected services are not available");
    }
    const servicesById = new Map(services.map((item) => [item.id, item]));
    const serviceSelections = input.serviceSelections.map((row) => ({
      serviceId: row.serviceId,
      name: servicesById.get(row.serviceId)?.name ?? "Service",
      quantity: row.quantity,
    }));

    const enquiry = await healthEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      appointmentDate: parseDateOnly(input.appointmentDate),
      appointmentTime: input.appointmentTime,
      patients: input.patients,
      concern: input.concern,
      notes: input.notes,
      serviceSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "health_enquiry.create",
      entityType: "health_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const serviceLines = serviceSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New health enquiry for ${business.name}`,
        body: [
          `A customer requested an appointment from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Appointment: ${input.appointmentDate}${input.appointmentTime ? ` at ${input.appointmentTime}` : ""}`,
          `Patients: ${input.patients}`,
          input.concern ? `Concern: ${input.concern}` : null,
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

  async listForActor(query: HealthEnquiryListQuery, user: AuthUser) {
    const where: Prisma.HealthEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      healthEnquiriesRepository.list(where, skip, query.pageSize),
      healthEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateHealthEnquiryInput, user: AuthUser) {
    const existing = await healthEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Health enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return healthEnquiriesRepository.update(id, {
      status: input.status as HealthEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
