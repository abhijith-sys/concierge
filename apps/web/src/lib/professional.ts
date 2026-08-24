import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const PROFESSIONAL_ROOT_SLUG = "professional-business";

const PROFESSIONAL_SERVICE_SLUGS = new Set([
  "chartered-accountants",
  "lawyers",
  "tax-consultants",
  "digital-marketing",
  "business-consultants",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isProfessionalRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === PROFESSIONAL_ROOT_SLUG ||
    category.parent?.slug === PROFESSIONAL_ROOT_SLUG ||
    PROFESSIONAL_SERVICE_SLUGS.has(category.slug)
  );
}

export function isProfessionalListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return PROFESSIONAL_SERVICE_SLUGS.has(slug);
}

export function professionalServiceRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const retainer = fieldNumber(service.fieldValues, "price_retainer");
  const project = fieldNumber(service.fieldValues, "price_project");
  const fallback = Number(service.price) || 0;
  const from = [hourly, retainer, project, fallback].filter((value) => value != null && value > 0);
  return {
    hourly,
    retainer,
    project,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatProfessionalMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatProfessionalFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = professionalServiceRates(service);
  const unit =
    rates.hourly != null && rates.hourly === rates.from
      ? "hr"
      : rates.retainer != null && rates.retainer === rates.from
        ? "retainer"
        : "project";
  return `From ${formatProfessionalMoney(rates.from, rates.currency)} / ${unit}`;
}

export function professionalDurationHours(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_hours");
}

export type ProfessionalHighlight = { kind: "check"; label: string };

export function professionalFirmHighlights(listingFields?: FieldValue[]): ProfessionalHighlight[] {
  const items: ProfessionalHighlight[] = [];
  const areas = fieldByKey(listingFields, "practice_areas")?.value;
  if (Array.isArray(areas) && areas.length) {
    items.push({ kind: "check", label: areas.slice(0, 2).join(", ") });
  } else {
    const areasText = displayValue(areas);
    if (areasText) items.push({ kind: "check", label: areasText });
  }
  if (fieldByKey(listingFields, "remote_available")?.value === true) {
    items.push({ kind: "check", label: "Remote available" });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function professionalPreviewTags(listingFields?: FieldValue[]) {
  return professionalFirmHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
