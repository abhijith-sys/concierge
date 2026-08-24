import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const HEALTH_ROOT_SLUG = "health-wellness";

const HEALTH_SERVICE_SLUGS = new Set([
  "dentists",
  "hospitals",
  "clinics",
  "physiotherapy",
  "beauty-spa-wellness",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isHealthRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === HEALTH_ROOT_SLUG ||
    category.parent?.slug === HEALTH_ROOT_SLUG ||
    HEALTH_SERVICE_SLUGS.has(category.slug)
  );
}

export function isHealthListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return HEALTH_SERVICE_SLUGS.has(slug);
}

export function healthServiceRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const session = fieldNumber(service.fieldValues, "price_session");
  const packageRate = fieldNumber(service.fieldValues, "price_package");
  const fallback = Number(service.price) || 0;
  const from = [session, packageRate, fallback].filter((value) => value != null && value > 0);
  return {
    session,
    package: packageRate,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatHealthMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatHealthFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = healthServiceRates(service);
  const unit = rates.session != null && rates.session === rates.from ? "session" : "package";
  return `From ${formatHealthMoney(rates.from, rates.currency)} / ${unit}`;
}

export function healthDurationMinutes(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_minutes");
}

export type HealthHighlight = { kind: "check"; label: string };

export function healthPracticeHighlights(listingFields?: FieldValue[]): HealthHighlight[] {
  const items: HealthHighlight[] = [];
  const specialties = fieldByKey(listingFields, "specialties")?.value;
  if (Array.isArray(specialties) && specialties.length) {
    items.push({ kind: "check", label: specialties.slice(0, 2).join(", ") });
  } else {
    const specialtiesText = displayValue(specialties);
    if (specialtiesText) items.push({ kind: "check", label: specialtiesText });
  }
  if (fieldByKey(listingFields, "home_visit")?.value === true) {
    items.push({ kind: "check", label: "Home visit available" });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function healthPreviewTags(listingFields?: FieldValue[]) {
  return healthPracticeHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
