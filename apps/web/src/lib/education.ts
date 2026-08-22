import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldNumber } from "./stays";

export const EDUCATION_ROOT_SLUG = "education-training";

const EDUCATION_SERVICE_SLUGS = new Set([
  "coaching",
  "tuition",
  "vocational-training",
  "language-training",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isEducationRoot(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  return (
    category.slug === EDUCATION_ROOT_SLUG ||
    category.parent?.slug === EDUCATION_ROOT_SLUG ||
    EDUCATION_SERVICE_SLUGS.has(category.slug)
  );
}

export function isEducationListing(listing?: Pick<Listing, "category"> | null) {
  const slug = listing?.category?.slug;
  if (!slug) return false;
  return EDUCATION_SERVICE_SLUGS.has(slug);
}

export function educationCourseRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const session = fieldNumber(service.fieldValues, "price_session");
  const course = fieldNumber(service.fieldValues, "price_course");
  const fallback = Number(service.price) || 0;
  const from = [hourly, session, course, fallback].filter((value) => value != null && value > 0);
  return {
    hourly,
    session,
    course,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatEducationMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatEducationFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = educationCourseRates(service);
  const unit =
    rates.hourly != null && rates.hourly === rates.from
      ? "hr"
      : rates.session != null && rates.session === rates.from
        ? "session"
        : "course";
  return `From ${formatEducationMoney(rates.from, rates.currency)} / ${unit}`;
}

export function educationBatchSize(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "batch_size");
}

export function educationDurationWeeks(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "duration_weeks");
}

export function educationSessionHours(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "session_hours");
}

export type EducationHighlight = { kind: "check"; label: string };

export function educationInstituteHighlights(listingFields?: FieldValue[]): EducationHighlight[] {
  const items: EducationHighlight[] = [];
  const subjects = fieldByKey(listingFields, "subjects")?.value;
  if (Array.isArray(subjects) && subjects.length) {
    items.push({ kind: "check", label: subjects.slice(0, 2).join(", ") });
  } else {
    const subjectsText = displayValue(subjects);
    if (subjectsText) items.push({ kind: "check", label: subjectsText });
  }
  const modes = fieldByKey(listingFields, "modes_offered")?.value;
  if (Array.isArray(modes) && modes.length) {
    items.push({ kind: "check", label: modes.slice(0, 2).join(", ") });
  } else {
    const modesText = displayValue(modes);
    if (modesText) items.push({ kind: "check", label: modesText });
  }
  const cancellation = displayValue(fieldByKey(listingFields, "cancellation_policy")?.value);
  if (/flexible|moderate/i.test(cancellation)) {
    items.push({ kind: "check", label: "Free cancellation window" });
  } else if (cancellation) {
    items.push({ kind: "check", label: `${cancellation} cancellation` });
  }
  return items;
}

export function educationPreviewTags(listingFields?: FieldValue[]) {
  return educationInstituteHighlights(listingFields).map((item) => item.label);
}

export { fieldNumber };
