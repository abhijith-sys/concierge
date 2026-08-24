import { describe, expect, it } from "vitest";
import { educationCourseFields, educationVendorFields } from "../../prisma/taxonomy";
import { createEducationEnquirySchema } from "../../src/modules/bookings/education-enquiries.schemas";
import { isEducationRootSlug, isEducationServiceCategorySlug } from "../../src/shared/domain/education";

describe("education enquiry schema", () => {
  it("requires start date and at least one course", () => {
    const parsed = createEducationEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      startDate: "2026-09-12",
      preferredTime: "10:00",
      learningMode: "Online",
      learners: 2,
      courseSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.learners).toBe(2);
    expect(() =>
      createEducationEnquirySchema.parse({
        ...parsed,
        courseSelections: [],
      }),
    ).toThrow();
  });
});

describe("education taxonomy", () => {
  it("collects provider policies and course rates", () => {
    expect(educationVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "subjects", "modes_offered", "cancellation_policy"]),
    );
    expect(educationCourseFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["course_type", "duration_weeks", "batch_size", "price_course"]),
    );
    expect(isEducationRootSlug("education-training")).toBe(true);
    expect(isEducationServiceCategorySlug("coaching")).toBe(true);
    expect(isEducationServiceCategorySlug("books-stationery")).toBe(false);
  });
});
