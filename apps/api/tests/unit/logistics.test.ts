import { describe, expect, it } from "vitest";
import { logisticsOfferingFields, logisticsVendorFields } from "../../prisma/taxonomy";
import { createLogisticsEnquirySchema } from "../../src/modules/bookings/logistics-enquiries.schemas";
import { isLogisticsRootSlug, isLogisticsServiceCategorySlug } from "../../src/shared/domain/logistics";

describe("logistics enquiry schema", () => {
  it("requires pickup, dropoff, and at least one service", () => {
    const parsed = createLogisticsEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      pickupDate: "2026-09-12",
      pickupTime: "09:00",
      pickupLocation: "Brooklyn loft",
      dropoffLocation: "Jersey City warehouse",
      serviceSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.packingRequired).toBe(false);
    expect(() =>
      createLogisticsEnquirySchema.parse({
        ...parsed,
        pickupLocation: "",
      }),
    ).toThrow();
  });
});

describe("logistics taxonomy", () => {
  it("collects operator policies and offering rates", () => {
    expect(logisticsVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "coverage_area", "packing_available", "insurance_available"]),
    );
    expect(logisticsOfferingFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["offering_type", "vehicle_type", "capacity_kg", "price_per_km"]),
    );
    expect(isLogisticsRootSlug("logistics-other")).toBe(true);
    expect(isLogisticsServiceCategorySlug("packers-movers")).toBe(true);
    expect(isLogisticsServiceCategorySlug("fabricators")).toBe(false);
  });
});
