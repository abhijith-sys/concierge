import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";

export const STAY_ROOT_SLUG = "hotels-resorts-stays";

const STAY_SUB_SLUGS = new Set([
  "hotels",
  "resorts",
  "homestays",
  "villas",
  "serviced-apartments",
  "guest-houses",
  "hostels",
  "boutique-hotels",
  "farm-stays",
  "cottages",
  "camping-glamping",
]);

export function isStayCategory(
  category?: Pick<Category, "slug"> & { parent?: { slug?: string | null } | null } | null,
) {
  if (!category?.slug) return false;
  if (category.slug === STAY_ROOT_SLUG) return true;
  if (category.parent?.slug === STAY_ROOT_SLUG) return true;
  return STAY_SUB_SLUGS.has(category.slug);
}

export function isStayListing(listing?: Pick<Listing, "category"> | null) {
  return isStayCategory(listing?.category);
}

export function fieldNumber(fields: FieldValue[] | undefined, key: string) {
  const raw = fieldByKey(fields, key)?.value;
  const num = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function fieldList(fields: FieldValue[] | undefined, key: string) {
  const raw = fieldByKey(fields, key)?.value;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  const text = displayValue(raw);
  return text ? [text] : [];
}

export function stayRoomRates(service: Pick<Service, "price" | "currency" | "fieldValues">) {
  const weekday = fieldNumber(service.fieldValues, "rate_weekday") ?? Number(service.price) ?? 0;
  const weekend = fieldNumber(service.fieldValues, "rate_weekend");
  const extraPerson = fieldNumber(service.fieldValues, "rate_extra_person");
  const extraBed = fieldNumber(service.fieldValues, "rate_extra_bed");
  return { weekday, weekend, extraPerson, extraBed, currency: service.currency || "USD" };
}

export function formatStayMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatStayNightly(service: Pick<Service, "price" | "currency" | "fieldValues">) {
  const rates = stayRoomRates(service);
  const from = rates.weekend != null ? Math.min(rates.weekday, rates.weekend) : rates.weekday;
  return `From ${formatStayMoney(from, rates.currency)} / night`;
}

export function occupancyLabel(service: Pick<Service, "fieldValues">) {
  const adults = fieldNumber(service.fieldValues, "occupancy_adults");
  const children = fieldNumber(service.fieldValues, "occupancy_children");
  if (!adults) return null;
  const parts = [`${adults} adult${adults === 1 ? "" : "s"}`];
  if (children) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  return parts.join(", ");
}

export type StayHighlight = { kind: "couple" | "check"; label: string };

export function stayRoomHighlights(listingFields?: FieldValue[]): StayHighlight[] {
  const items: StayHighlight[] = [];
  if (fieldByKey(listingFields, "couples_allowed")?.value === true) {
    items.push({ kind: "couple", label: "Couple Friendly" });
  }
  if (fieldByKey(listingFields, "pets_allowed")?.value === true) {
    items.push({ kind: "check", label: "Pet friendly" });
  }
  const meals = fieldList(listingFields, "meals");
  const breakfastIncluded =
    fieldByKey(listingFields, "breakfast_included")?.value === true ||
    meals.some((item) => /breakfast|all meals/i.test(item));
  if (breakfastIncluded) {
    items.push({ kind: "check", label: "Breakfast Included" });
  } else if (meals.length) {
    items.push({ kind: "check", label: "Breakfast available at extra charges" });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free Cancellation" });
  } else if (/non-refundable/i.test(cancellation)) {
    items.push({ kind: "check", label: "Non-refundable" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const start = new Date(`${checkIn}T00:00:00`).getTime();
  const end = new Date(`${checkOut}T00:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}
