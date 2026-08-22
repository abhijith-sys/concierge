import { describe, expect, it } from "vitest";
import { electronicsTradePackageFields, electronicsTradeVendorFields } from "../../prisma/taxonomy";
import { createElectronicsEnquirySchema } from "../../src/modules/bookings/electronics-enquiries.schemas";
import {
  isElectronicsRootSlug,
  isElectronicsServiceCategorySlug,
} from "../../src/shared/domain/electronics";

describe("electronics enquiry schema", () => {
  it("requires preferred date and at least one service", () => {
    const parsed = createElectronicsEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      preferredDate: "2026-09-12",
      preferredTime: "15:00",
      deviceInfo: "MacBook Pro 14",
      serviceSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.deviceInfo).toBe("MacBook Pro 14");
    expect(() =>
      createElectronicsEnquirySchema.parse({
        ...parsed,
        serviceSelections: [],
      }),
    ).toThrow();
  });
});

describe("electronics taxonomy", () => {
  it("collects repair policies and package rates", () => {
    expect(electronicsTradeVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "device_types", "cancellation_policy"]),
    );
    expect(electronicsTradePackageFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["job_package_type", "duration_hours", "price_hourly", "price_job"]),
    );
    expect(isElectronicsRootSlug("electronics-technology")).toBe(true);
    expect(isElectronicsServiceCategorySlug("computer-laptop-repair")).toBe(true);
    expect(isElectronicsServiceCategorySlug("electronics-wholesale")).toBe(false);
  });
});
