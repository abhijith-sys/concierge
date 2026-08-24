import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldList, fieldNumber } from "./stays";

export const TRAVEL_ROOT_SLUG = "travel-taxi-transport";

const TRAVEL_SUB_SLUGS = new Set([
  "taxi-services",
  "cab-services",
  "airport-transfers",
  "outstation-taxi",
  "local-taxi",
  "bike-taxi",
  "auto-services",
  "bus-services",
  "tour-operators",
  "travel-agencies",
  "chauffeur-services",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isTravelCategory(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  if (category.slug === TRAVEL_ROOT_SLUG) return true;
  if (category.parent?.slug === TRAVEL_ROOT_SLUG) return true;
  return TRAVEL_SUB_SLUGS.has(category.slug);
}

export function isTravelListing(listing?: Pick<Listing, "category"> | null) {
  return isTravelCategory(listing?.category);
}

export function travelVehicleRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const perKm = fieldNumber(service.fieldValues, "price_per_km");
  const airport = fieldNumber(service.fieldValues, "price_airport");
  const outstation = fieldNumber(service.fieldValues, "price_outstation_day");
  const fallback = Number(service.price) || 0;
  const from = [hourly, airport, outstation, fallback].filter((value) => value != null && value > 0);
  return {
    hourly,
    perKm,
    airport,
    outstation,
    night: fieldNumber(service.fieldValues, "night_charge"),
    waiting: fieldNumber(service.fieldValues, "waiting_charge"),
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatTravelMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatTravelFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = travelVehicleRates(service);
  const unit =
    rates.hourly != null && rates.hourly === rates.from
      ? "hr"
      : rates.airport != null && rates.airport === rates.from
        ? "airport"
        : "trip";
  return `From ${formatTravelMoney(rates.from, rates.currency)} / ${unit}`;
}

export function travelSeats(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "seating_capacity");
}

export function travelVehicleCount(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "vehicle_count");
}

export type TravelHighlight = { kind: "check"; label: string };

export function travelOperatorHighlights(listingFields?: FieldValue[]): TravelHighlight[] {
  const items: TravelHighlight[] = [];
  if (fieldByKey(listingFields, "airport_transfer")?.value === true) {
    items.push({ kind: "check", label: "Airport transfers" });
  }
  if (fieldByKey(listingFields, "outstation_available")?.value === true) {
    items.push({ kind: "check", label: "Outstation trips" });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (/non-refundable/i.test(cancellation)) {
    items.push({ kind: "check", label: "Non-refundable" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function travelPreviewTags(listingFields?: FieldValue[]) {
  return travelOperatorHighlights(listingFields).map((item) => item.label);
}

export { fieldList, fieldNumber };
