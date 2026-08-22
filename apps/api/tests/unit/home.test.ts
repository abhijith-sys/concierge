import { describe, expect, it } from "vitest";
import { homeTradePackageFields, homeTradeVendorFields } from "../../prisma/taxonomy";
import { createHomeTradeEnquirySchema } from "../../src/modules/bookings/home-trade-enquiries.schemas";
import { isHomeRootSlug, isHomeServiceCategorySlug } from "../../src/shared/domain/home";

describe("home trade enquiry schema", () => {
  it("requires preferred date, job location, and at least one service", () => {
    const parsed = createHomeTradeEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      preferredDate: "2026-09-12",
      preferredTime: "09:00",
      jobLocation: "12 MG Road, Bengaluru",
      serviceSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.jobLocation).toBe("12 MG Road, Bengaluru");
    expect(() =>
      createHomeTradeEnquirySchema.parse({
        ...parsed,
        jobLocation: "a",
      }),
    ).toThrow();
    expect(() =>
      createHomeTradeEnquirySchema.parse({
        ...parsed,
        serviceSelections: [],
      }),
    ).toThrow();
  });
});

describe("home trade taxonomy", () => {
  it("collects trade policies and package rates", () => {
    expect(homeTradeVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "job_types", "service_radius_km", "cancellation_policy"]),
    );
    expect(homeTradePackageFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["job_package_type", "duration_hours", "price_hourly", "price_job"]),
    );
    expect(isHomeRootSlug("home-property")).toBe(true);
    expect(isHomeServiceCategorySlug("electricians")).toBe(true);
    expect(isHomeServiceCategorySlug("hardware-stores")).toBe(false);
  });
});
