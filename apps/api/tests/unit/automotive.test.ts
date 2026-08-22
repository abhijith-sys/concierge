import { describe, expect, it } from "vitest";
import { autoTradePackageFields, autoTradeVendorFields } from "../../prisma/taxonomy";
import { createAutomotiveEnquirySchema } from "../../src/modules/bookings/automotive-enquiries.schemas";
import {
  isAutomotiveRootSlug,
  isAutomotiveServiceCategorySlug,
} from "../../src/shared/domain/automotive";

describe("automotive enquiry schema", () => {
  it("requires preferred date and at least one service", () => {
    const parsed = createAutomotiveEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      preferredDate: "2026-09-12",
      preferredTime: "11:00",
      vehicleInfo: "Honda City 2019",
      serviceSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.vehicleInfo).toBe("Honda City 2019");
    expect(() =>
      createAutomotiveEnquirySchema.parse({
        ...parsed,
        serviceSelections: [],
      }),
    ).toThrow();
  });
});

describe("automotive taxonomy", () => {
  it("collects workshop policies and package rates", () => {
    expect(autoTradeVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "vehicle_types", "cancellation_policy"]),
    );
    expect(autoTradePackageFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["job_package_type", "duration_hours", "price_hourly", "price_job"]),
    );
    expect(isAutomotiveRootSlug("automotive")).toBe(true);
    expect(isAutomotiveServiceCategorySlug("car-repair-services")).toBe(true);
    expect(isAutomotiveServiceCategorySlug("auto-parts")).toBe(false);
  });
});
