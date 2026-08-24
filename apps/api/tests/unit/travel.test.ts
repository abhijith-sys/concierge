import { describe, expect, it } from "vitest";
import { travelOperatorFields, travelVehicleFields } from "../../prisma/taxonomy";
import { createTravelEnquirySchema } from "../../src/modules/bookings/travel-enquiries.schemas";
import { isTravelCategorySlug } from "../../src/shared/domain/travel";

describe("travel enquiry schema", () => {
  it("requires pickup, dropoff, and at least one vehicle", () => {
    const parsed = createTravelEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      pickupDate: "2026-09-01",
      pickupTime: "09:30",
      pickupLocation: "JFK Terminal 4",
      dropoffLocation: "Times Square",
      passengers: 3,
      vehicleSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.roundTrip).toBe(false);
    expect(parsed.passengers).toBe(3);
    expect(() =>
      createTravelEnquirySchema.parse({
        ...parsed,
        pickupLocation: "",
      }),
    ).toThrow();
  });
});

describe("travel taxonomy", () => {
  it("collects operator policies and vehicle rates", () => {
    expect(travelOperatorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining([
        "service_hours",
        "airports_served",
        "outstation_available",
        "airport_transfer",
        "cancellation_policy",
      ]),
    );
    expect(travelVehicleFields.map((field) => field.key)).toEqual(
      expect.arrayContaining([
        "vehicle_type",
        "seating_capacity",
        "price_per_km",
        "price_hourly",
        "price_airport",
        "vehicle_count",
      ]),
    );
    expect(isTravelCategorySlug("taxi-services")).toBe(true);
    expect(isTravelCategorySlug("airport-transfers")).toBe(true);
    expect(isTravelCategorySlug("travel-taxi-transport")).toBe(true);
    expect(isTravelCategorySlug("car-rental")).toBe(false);
  });
});
