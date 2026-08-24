import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const HOME_ROOT_SLUG = "home-property";

const HOME_SERVICE_SLUGS = new Set([
  "electricians",
  "plumbers",
  "ac-services",
  "interior-designers",
  "painting-contractors",
  "carpenter-services",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isHomeRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === HOME_ROOT_SLUG ||
    category.parent?.slug === HOME_ROOT_SLUG ||
    HOME_SERVICE_SLUGS.has(category.slug)
  );
}

export function isHomeListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return HOME_SERVICE_SLUGS.has(slug);
}

export function homePackageRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
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

export function formatHomeMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatHomeFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = homePackageRates(service);
  const unit = rates.hourly != null && rates.hourly === rates.from ? "hr" : "job";
  return `From ${formatHomeMoney(rates.from, rates.currency)} / ${unit}`;
}

export function homeDurationHours(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_hours");
}

export type HomeHighlight = { kind: "check"; label: string };

export function homeTradeHighlights(listingFields?: FieldValue[]): HomeHighlight[] {
  const items: HomeHighlight[] = [];
  const jobTypes = fieldByKey(listingFields, "job_types")?.value;
  if (Array.isArray(jobTypes) && jobTypes.length) {
    items.push({ kind: "check", label: jobTypes.slice(0, 2).join(", ") });
  } else {
    const jobText = displayValue(jobTypes);
    if (jobText) items.push({ kind: "check", label: jobText });
  }
  const radius = fieldNumber(listingFields, "service_radius_km");
  if (radius != null && radius > 0) {
    items.push({ kind: "check", label: `${radius} km radius` });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function homePreviewTags(listingFields?: FieldValue[]) {
  return homeTradeHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
