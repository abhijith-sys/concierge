import { BusinessStatus, Role, TravelEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isTravelCategorySlug } from "../../shared/domain/travel.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { travelEnquiriesRepository } from "./travel-enquiries.repository.js";
import type {
  CreateTravelEnquiryInput,
  TravelEnquiryListQuery,
  UpdateTravelEnquiryInput,
} from "./travel-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function travelSlugsOf(business: {
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

export const travelEnquiriesService = {
  async create(
    input: CreateTravelEnquiryInput,
    user?: AuthUser,
    ctx?: { ip?: string; requestId?: string },
  ) {
    const business = await travelEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This operator is not available");
    }
    if (!travelSlugsOf(business).some(isTravelCategorySlug)) {
      throw new ApiError(400, "NOT_A_TRAVEL", "Enquiries of this type are only for travel and taxi listings");
    }

    const requestedIds = [...new Set(input.vehicleSelections.map((row) => row.serviceId))];
    const vehicles = await travelEnquiriesRepository.findApprovedVehicles(business.id, requestedIds);
    if (vehicles.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_VEHICLES", "One or more selected vehicles are not available");
    }
    const vehiclesById = new Map(vehicles.map((item) => [item.id, item]));
    const vehicleSelections = input.vehicleSelections.map((row) => ({
      serviceId: row.serviceId,
      name: vehiclesById.get(row.serviceId)?.name ?? "Vehicle",
      quantity: row.quantity,
    }));

    const enquiry = await travelEnquiriesRepository.create({
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
      passengers: input.passengers,
      roundTrip: input.roundTrip ?? false,
      notes: input.notes,
      vehicleSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "travel_enquiry.create",
      entityType: "travel_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const vehicleLines = vehicleSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New trip enquiry for ${business.name}`,
        body: [
          `A customer requested a trip from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Pickup: ${input.pickupDate}${input.pickupTime ? ` at ${input.pickupTime}` : ""}`,
          `From: ${input.pickupLocation}`,
          `To: ${input.dropoffLocation}`,
          `Passengers: ${input.passengers}`,
          input.roundTrip ? "Round trip: yes" : "Round trip: no",
          "",
          "Vehicles:",
          vehicleLines,
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

  async listForActor(query: TravelEnquiryListQuery, user: AuthUser) {
    const where: Prisma.TravelEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      travelEnquiriesRepository.list(where, skip, query.pageSize),
      travelEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateTravelEnquiryInput, user: AuthUser) {
    const existing = await travelEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Travel enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return travelEnquiriesRepository.update(id, {
      status: input.status as TravelEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
