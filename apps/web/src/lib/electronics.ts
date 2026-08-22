import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const ELECTRONICS_ROOT_SLUG = "electronics-technology";

const ELECTRONICS_SERVICE_SLUGS = new Set([
  "computer-laptop-repair",
  "mobile-phone-repair",
  "cctv-services",
  "it-services",
  "electronics-repair",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isElectronicsRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === ELECTRONICS_ROOT_SLUG ||
    category.parent?.slug === ELECTRONICS_ROOT_SLUG ||
    ELECTRONICS_SERVICE_SLUGS.has(category.slug)
  );
}

export function isElectronicsListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return ELECTRONICS_SERVICE_SLUGS.has(slug);
}

export function electronicsPackageRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
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

export function formatElectronicsMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatElectronicsFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = electronicsPackageRates(service);
  const unit = rates.hourly != null && rates.hourly === rates.from ? "hr" : "job";
  return `From ${formatElectronicsMoney(rates.from, rates.currency)} / ${unit}`;
}

export function electronicsDurationHours(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_hours");
}

export type ElectronicsHighlight = { kind: "check"; label: string };

export function electronicsRepairHighlights(listingFields?: FieldValue[]): ElectronicsHighlight[] {
  const items: ElectronicsHighlight[] = [];
  const deviceTypes = fieldByKey(listingFields, "device_types")?.value;
  if (Array.isArray(deviceTypes) && deviceTypes.length) {
    items.push({ kind: "check", label: deviceTypes.slice(0, 2).join(", ") });
  } else {
    const deviceText = displayValue(deviceTypes);
    if (deviceText) items.push({ kind: "check", label: deviceText });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function electronicsPreviewTags(listingFields?: FieldValue[]) {
  return electronicsRepairHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
