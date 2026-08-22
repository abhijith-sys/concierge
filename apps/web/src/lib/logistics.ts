import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const LOGISTICS_ROOT_SLUG = "logistics-other";

const LOGISTICS_SERVICE_SLUGS = new Set([
  "courier-services",
  "packers-movers",
  "transporters",
  "security-services",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isLogisticsRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === LOGISTICS_ROOT_SLUG ||
    category.parent?.slug === LOGISTICS_ROOT_SLUG ||
    LOGISTICS_SERVICE_SLUGS.has(category.slug)
  );
}

export function isLogisticsListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return LOGISTICS_SERVICE_SLUGS.has(slug);
}

export function logisticsOfferingRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const perKm = fieldNumber(service.fieldValues, "price_per_km");
  const day = fieldNumber(service.fieldValues, "price_day");
  const fallback = Number(service.price) || 0;
  const from = [hourly, day, fallback].filter((value) => value != null && value > 0);
  return {
    hourly,
    perKm,
    day,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatLogisticsMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatLogisticsFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = logisticsOfferingRates(service);
  const unit = rates.hourly != null && rates.hourly === rates.from ? "hr" : "job";
  return `From ${formatLogisticsMoney(rates.from, rates.currency)} / ${unit}`;
}

export function logisticsCapacity(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "capacity_kg");
}

export function logisticsCrew(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "crew_size");
}

export function logisticsVehicleCount(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "vehicle_count");
}

export type LogisticsHighlight = { kind: "check"; label: string };

export function logisticsOperatorHighlights(listingFields?: FieldValue[]): LogisticsHighlight[] {
  const items: LogisticsHighlight[] = [];
  if (fieldByKey(listingFields, "packing_available")?.value === true) {
    items.push({ kind: "check", label: "Packing available" });
  }
  if (fieldByKey(listingFields, "insurance_available")?.value === true) {
    items.push({ kind: "check", label: "Insured moves" });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function logisticsPreviewTags(listingFields?: FieldValue[]) {
  return logisticsOperatorHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
