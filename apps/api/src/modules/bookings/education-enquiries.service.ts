import { BusinessStatus, Role, EducationEnquiryStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { isEducationServiceCategorySlug } from "../../shared/domain/education.js";
import { EmailService } from "../../shared/integrations/email.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { brand } from "../../shared/brand.js";
import { educationEnquiriesRepository } from "./education-enquiries.repository.js";
import type {
  CreateEducationEnquiryInput,
  EducationEnquiryListQuery,
  UpdateEducationEnquiryInput,
} from "./education-enquiries.schemas.js";

type AuthUser = { id: string; role: Role };

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function educationSlugsOf(business: {
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

export const educationEnquiriesService = {
  async create(input: CreateEducationEnquiryInput, user?: AuthUser, ctx?: { ip?: string; requestId?: string }) {
    const business = await educationEnquiriesRepository.findBusinessForEnquiry(input.businessId);
    if (!business || business.status !== BusinessStatus.active || !business.listing) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "This education provider is not available");
    }
    if (!educationSlugsOf(business).some(isEducationServiceCategorySlug)) {
      throw new ApiError(400, "NOT_EDUCATION", "Enquiries of this type are only for education and training listings");
    }

    const requestedIds = [...new Set(input.courseSelections.map((row) => row.serviceId))];
    const courses = await educationEnquiriesRepository.findApprovedCourses(business.id, requestedIds);
    if (courses.length !== requestedIds.length) {
      throw new ApiError(400, "INVALID_COURSES", "One or more selected courses are not available");
    }
    const coursesById = new Map(courses.map((item) => [item.id, item]));
    const courseSelections = input.courseSelections.map((row) => ({
      serviceId: row.serviceId,
      name: coursesById.get(row.serviceId)?.name ?? "Course",
      quantity: row.quantity,
    }));

    const enquiry = await educationEnquiriesRepository.create({
      business: { connect: { id: business.id } },
      listing: { connect: { id: business.listing.id } },
      user: user ? { connect: { id: user.id } } : undefined,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      startDate: parseDateOnly(input.startDate),
      preferredTime: input.preferredTime,
      learningMode: input.learningMode,
      learners: input.learners,
      notes: input.notes,
      courseSelections,
    });

    await writeAuditLog({
      actorId: user?.id,
      action: "education_enquiry.create",
      entityType: "education_enquiry",
      entityId: enquiry.id,
      meta: { businessId: business.id },
      ip: ctx?.ip,
      requestId: ctx?.requestId,
    });

    const courseLines = courseSelections.map((row) => `- ${row.name} × ${row.quantity}`).join("\n");
    try {
      await EmailService.send({
        to: business.email,
        subject: `New education enquiry for ${business.name}`,
        body: [
          `A customer requested a course or training from ${business.name}.`,
          "",
          `Customer: ${input.guestName}`,
          `Email: ${input.guestEmail}`,
          input.guestPhone ? `Phone: ${input.guestPhone}` : null,
          `Start: ${input.startDate}${input.preferredTime ? ` at ${input.preferredTime}` : ""}`,
          input.learningMode ? `Mode: ${input.learningMode}` : null,
          `Learners: ${input.learners}`,
          "",
          "Courses:",
          courseLines,
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

  async listForActor(query: EducationEnquiryListQuery, user: AuthUser) {
    const where: Prisma.EducationEnquiryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(user.role === Role.admin ? {} : { business: { ownerId: user.id } }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      educationEnquiriesRepository.list(where, skip, query.pageSize),
      educationEnquiriesRepository.count(where),
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

  async update(id: string, input: UpdateEducationEnquiryInput, user: AuthUser) {
    const existing = await educationEnquiriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Education enquiry not found");
    if (!canManage(existing, user)) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this enquiry");
    }
    return educationEnquiriesRepository.update(id, {
      status: input.status as EducationEnquiryStatus | undefined,
      ownerNote: input.ownerNote,
    });
  },
};
