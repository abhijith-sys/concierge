import { describe, expect, it } from "vitest";
import { rentalHireListingFields, rentalVendorFields } from "../../prisma/taxonomy";
import { createRentalEnquirySchema } from "../../src/modules/bookings/rental-enquiries.schemas";
import { isRentalCategorySlug } from "../../src/shared/domain/rentals";

describe("rental enquiry schema", () => {
  it("allows same-day hire and requires at least one item", () => {
    const parsed = createRentalEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      hireFrom: "2026-09-01",
      hireTo: "2026-09-01",
      itemSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 2 }],
    });
    expect(parsed.deliveryRequested).toBe(false);
    expect(parsed.itemSelections[0]?.quantity).toBe(2);
    expect(() =>
      createRentalEnquirySchema.parse({
        ...parsed,
        hireTo: "2026-08-31",
      }),
    ).toThrow(/hire-to/i);
  });
});

describe("rental taxonomy", () => {
  it("collects shop policies and item rates", () => {
    expect(rentalVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining([
        "pickup_hours",
        "delivery_available",
        "id_proof_required",
        "damage_policy",
        "cancellation_policy",
      ]),
    );
    expect(rentalHireListingFields.map((field) => field.key)).toEqual(
      expect.arrayContaining([
        "rental_availability",
        "quantity",
        "price_daily",
        "security_deposit",
        "rental_location",
      ]),
    );
    expect(isRentalCategorySlug("car-rental")).toBe(true);
    expect(isRentalCategorySlug("vehicle-rental")).toBe(true);
    expect(isRentalCategorySlug("rental-hire")).toBe(true);
    expect(isRentalCategorySlug("resorts")).toBe(false);
  });
});
