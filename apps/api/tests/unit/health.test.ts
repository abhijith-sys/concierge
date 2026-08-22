import { describe, expect, it } from "vitest";
import { healthServiceFields, healthVendorFields } from "../../prisma/taxonomy";
import { createHealthEnquirySchema } from "../../src/modules/bookings/health-enquiries.schemas";
import { isHealthRootSlug, isHealthServiceCategorySlug } from "../../src/shared/domain/health";

describe("health enquiry schema", () => {
  it("requires appointment date and at least one service", () => {
    const parsed = createHealthEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      appointmentDate: "2026-09-12",
      appointmentTime: "11:00",
      patients: 1,
      concern: "Routine check-up",
      serviceSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.patients).toBe(1);
    expect(() =>
      createHealthEnquirySchema.parse({
        ...parsed,
        serviceSelections: [],
      }),
    ).toThrow();
  });
});

describe("health taxonomy", () => {
  it("collects provider policies and treatment rates", () => {
    expect(healthVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "specialties", "home_visit", "cancellation_policy"]),
    );
    expect(healthServiceFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["treatment_type", "duration_minutes", "price_session", "price_package"]),
    );
    expect(isHealthRootSlug("health-wellness")).toBe(true);
    expect(isHealthServiceCategorySlug("dentists")).toBe(true);
    expect(isHealthServiceCategorySlug("medical-supplies")).toBe(false);
  });
});
