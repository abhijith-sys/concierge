import { BusinessStatus, Role, RentalEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isRentalCategorySlug } from "../../shared/domain/rentals.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { rentalEnquiriesRepository } from "./rental-enquiries.repository.js";
import type {
  CreateRentalEnquiryInput,
  RentalEnquiryListQuery,
  UpdateRentalEnquiryInput,
} from "./rental-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function hireDays(hireFrom: string, hireTo: string) {
  const start = parseDateOnly(hireFrom).getTime();
  const end = parseDateOnly(hireTo).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function rentalSlugsOf(business: {
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

export const rentalEnquiriesService = {
  async create(
    input: CreateRentalEnquiryInput,
    user?: AuthUser,
    ctx?: { ip?: string; requestId?: string },
  ) {
    const business = await rentalEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This rental shop is not available");
    }
    if (!rentalSlugsOf(business).some(isRentalCategorySlug)) {
      throw new ApiError(400, "NOT_A_RENTAL", "Enquiries of this type are only for rental and hire listings");
    }

    const requestedIds = [...new Set(input.itemSelections.map((row) => row.serviceId))];
    const items = await rentalEnquiriesRepository.findApprovedItems(business.id, requestedIds);
    if (items.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_ITEMS", "One or more selected items are not available");
    }
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const itemSelections = input.itemSelections.map((row) => ({
      serviceId: row.serviceId,
      name: itemsById.get(row.serviceId)?.name ?? "Item",
      quantity: row.quantity,
    }));

    const enquiry = await rentalEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      hireFrom: parseDateOnly(input.hireFrom),
      hireTo: parseDateOnly(input.hireTo),
      deliveryRequested: input.deliveryRequested ?? false,
      notes: input.notes,
      itemSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "rental_enquiry.create",
      entityType: "rental_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const days = hireDays(input.hireFrom, input.hireTo);
    const itemLines = itemSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New hire enquiry for ${business.name}`,
        body: [
          `A customer requested a hire from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Dates: ${input.hireFrom} → ${input.hireTo} (${days} day${days === 1 ? "" : "s"})`,
          input.deliveryRequested ? "Delivery requested: yes" : "Delivery requested: no",
          "",
          "Items:",
          itemLines,
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

  async listForActor(query: RentalEnquiryListQuery, user: AuthUser) {
    const where: Prisma.RentalEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      rentalEnquiriesRepository.list(where, skip, query.pageSize),
      rentalEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateRentalEnquiryInput, user: AuthUser) {
    const existing = await rentalEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Rental enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return rentalEnquiriesRepository.update(id, {
      status: input.status as RentalEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
