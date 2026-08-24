import { describe, expect, it } from "vitest";
import { professionalServiceFields, professionalVendorFields } from "../../prisma/taxonomy";
import { createProfessionalEnquirySchema } from "../../src/modules/bookings/professional-enquiries.schemas";
import {
  isProfessionalRootSlug,
  isProfessionalServiceCategorySlug,
} from "../../src/shared/domain/professional";

describe("professional enquiry schema", () => {
  it("requires preferred date and at least one service", () => {
    const parsed = createProfessionalEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      preferredDate: "2026-09-12",
      preferredTime: "14:00",
      topic: "GST filing",
      serviceSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.topic).toBe("GST filing");
    expect(() =>
      createProfessionalEnquirySchema.parse({
        ...parsed,
        serviceSelections: [],
      }),
    ).toThrow();
  });
});

describe("professional taxonomy", () => {
  it("collects practice policies and engagement rates", () => {
    expect(professionalVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "practice_areas", "remote_available", "cancellation_policy"]),
    );
    expect(professionalServiceFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["engagement_type", "duration_hours", "price_hourly", "price_project"]),
    );
    expect(isProfessionalRootSlug("professional-business")).toBe(true);
    expect(isProfessionalServiceCategorySlug("chartered-accountants")).toBe(true);
    expect(isProfessionalServiceCategorySlug("office-supplies")).toBe(false);
  });
});
