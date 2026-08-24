import { describe, expect, it } from "vitest";
import { eventPackageFields, eventVendorFields } from "../../prisma/taxonomy";
import { createEventEnquirySchema } from "../../src/modules/bookings/event-enquiries.schemas";
import { isEventServiceCategorySlug, isEventsRootSlug } from "../../src/shared/domain/events";

describe("event enquiry schema", () => {
  it("requires venue, date, and at least one package", () => {
    const parsed = createEventEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      eventDate: "2026-09-12",
      eventTime: "18:00",
      venue: "The Plaza, Fifth Avenue",
      guests: 80,
      packageSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.guests).toBe(80);
    expect(() =>
      createEventEnquirySchema.parse({
        ...parsed,
        venue: "",
      }),
    ).toThrow();
  });
});

describe("event taxonomy", () => {
  it("collects crew policies and package rates", () => {
    expect(eventVendorFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["service_hours", "event_types", "travel_radius_km", "cancellation_policy"]),
    );
    expect(eventPackageFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["package_type", "duration_hours", "guest_capacity", "price_day"]),
    );
    expect(isEventsRootSlug("events-lifestyle")).toBe(true);
    expect(isEventServiceCategorySlug("photographers")).toBe(true);
    expect(isEventServiceCategorySlug("jewellery-showrooms")).toBe(false);
  });
});
