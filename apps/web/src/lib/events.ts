import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const EVENTS_ROOT_SLUG = "events-lifestyle";

const EVENT_SERVICE_SLUGS = new Set([
  "event-organizers",
  "photographers",
  "videographers",
  "caterers",
  "wedding-services",
  "makeup-artists",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isEventsRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === EVENTS_ROOT_SLUG ||
    category.parent?.slug === EVENTS_ROOT_SLUG ||
    EVENT_SERVICE_SLUGS.has(category.slug)
  );
}

export function isEventListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  if (EVENT_SERVICE_SLUGS.has(slug)) return true;
  return listing?.category?.parent?.slug === EVENTS_ROOT_SLUG && EVENT_SERVICE_SLUGS.has(slug);
}

export function eventPackageRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const day = fieldNumber(service.fieldValues, "price_day");
  const fallback = Number(service.price) || 0;
  const from = [hourly, day, fallback].filter((value) => value != null && value > 0);
  return {
    hourly,
    day,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatEventMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatEventFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = eventPackageRates(service);
  const unit = rates.hourly != null && rates.hourly === rates.from ? "hr" : "event";
  return `From ${formatEventMoney(rates.from, rates.currency)} / ${unit}`;
}

export function eventGuests(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "guest_capacity");
}

export function eventDuration(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_hours");
}

export type EventHighlight = { kind: "check"; label: string };

export function eventCrewHighlights(listingFields?: FieldValue[]): EventHighlight[] {
  const items: EventHighlight[] = [];
  const types = fieldByKey(listingFields, "event_types")?.value;
  if (Array.isArray(types) && types.length) {
    items.push({ kind: "check", label: types.slice(0, 2).join(", ") });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function eventPreviewTags(listingFields?: FieldValue[]) {
  return eventCrewHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
