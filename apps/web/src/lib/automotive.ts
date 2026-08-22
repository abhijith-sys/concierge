import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const AUTOMOTIVE_ROOT_SLUG = "automotive";

const AUTOMOTIVE_SERVICE_SLUGS = new Set([
  "car-repair-services",
  "bike-repair-services",
  "car-wash-detailing",
  "vehicle-towing",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isAutomotiveRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === AUTOMOTIVE_ROOT_SLUG ||
    category.parent?.slug === AUTOMOTIVE_ROOT_SLUG ||
    AUTOMOTIVE_SERVICE_SLUGS.has(category.slug)
  );
}

export function isAutomotiveListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return AUTOMOTIVE_SERVICE_SLUGS.has(slug);
}

export function automotivePackageRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const job = fieldNumber(service.fieldValues, "price_job");
  const fallback = Number(service.price) || 0;
  const from = [hourly, job, fallback].filter((value) => value != null && value > 0);
  return {
    hourly,
    job,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatAutomotiveMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatAutomotiveFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = automotivePackageRates(service);
  const unit = rates.hourly != null && rates.hourly === rates.from ? "hr" : "job";
  return `From ${formatAutomotiveMoney(rates.from, rates.currency)} / ${unit}`;
}

export function automotiveDurationHours(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_hours");
}

export type AutomotiveHighlight = { kind: "check"; label: string };

export function automotiveWorkshopHighlights(listingFields?: FieldValue[]): AutomotiveHighlight[] {
  const items: AutomotiveHighlight[] = [];
  const vehicleTypes = fieldByKey(listingFields, "vehicle_types")?.value;
  if (Array.isArray(vehicleTypes) && vehicleTypes.length) {
    items.push({ kind: "check", label: vehicleTypes.slice(0, 2).join(", ") });
  } else {
    const vehicleText = displayValue(vehicleTypes);
    if (vehicleText) items.push({ kind: "check", label: vehicleText });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function automotivePreviewTags(listingFields?: FieldValue[]) {
  return automotiveWorkshopHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
