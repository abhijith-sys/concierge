import { describe, expect, it } from "vitest";
import { stayPropertyFields, stayRoomFields } from "../../prisma/taxonomy";
import { createStayEnquirySchema } from "../../src/modules/bookings/stay-enquiries.schemas";
import { isStayCategorySlug } from "../../src/shared/domain/stays";

describe("stay enquiry schema", () => {
  it("requires checkout after check-in and at least one room", () => {
    const parsed = createStayEnquirySchema.parse({
      businessId: "11111111-1111-4111-8111-111111111111",
      guestName: "Anita",
      guestEmail: "anita@example.com",
      checkIn: "2026-09-01",
      checkOut: "2026-09-03",
      adults: 2,
      children: 1,
      roomSelections: [{ serviceId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
    });
    expect(parsed.children).toBe(1);
    expect(() =>
      createStayEnquirySchema.parse({
        ...parsed,
        checkOut: "2026-09-01",
      }),
    ).toThrow(/check-out/i);
  });
});

describe("stay taxonomy", () => {
  it("collects property facilities and room rates", () => {
    expect(stayPropertyFields.map((field) => field.key)).toEqual(
      expect.arrayContaining([
        "amenities_highlighted",
        "amenities_basic",
        "amenities_services",
        "amenities_wellness",
        "breakfast_included",
        "couples_allowed",
        "pets_allowed",
        "check_in_time",
      ]),
    );
    expect(stayRoomFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["room_type", "rate_weekday", "occupancy_adults", "room_facilities"]),
    );
    expect(stayRoomFields.find((field) => field.key === "room_facilities")?.options).toEqual(
      expect.arrayContaining(["Coffee Machine", "Dental Kit", "Work Desk", "Toiletries"]),
    );
    expect(stayPropertyFields.find((field) => field.key === "amenities_highlighted")?.options).toEqual(
      expect.arrayContaining(["Breakfast included", "Couple friendly", "Pet friendly"]),
    );
    expect(isStayCategorySlug("resorts")).toBe(true);
    expect(isStayCategorySlug("electrical")).toBe(false);
  });
});
