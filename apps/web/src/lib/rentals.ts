import type { Category, FieldValue, Listing, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";
import { fieldList, fieldNumber } from "./stays";

export const RENTAL_ROOT_SLUG = "rental-hire";

const RENTAL_SUB_SLUGS = new Set([
  "vehicle-rental",
  "electronics-rental",
  "event-equipment",
  "outdoor-travel",
  "tools-equipment",
  "furniture-rental",
  "car-rental",
  "bike-rental",
  "scooter-rental",
  "van-rental",
  "commercial-vehicle-rental",
  "camera-rental",
  "lens-rental",
  "drone-rental",
  "projector-rental",
  "laptop-rental",
  "speaker-rental",
  "event-chairs",
  "event-tables",
  "sound-systems",
  "event-lighting",
  "party-equipment",
  "camping-equipment",
  "trekking-equipment",
  "adventure-equipment",
  "power-tools",
  "construction-equipment",
  "generators",
  "agricultural-equipment",
  "home-furniture",
  "office-furniture",
  "event-furniture",
]);

type CategoryRef = Pick<Category, "slug"> & {
  parent?: { slug?: string | null; parent?: { slug?: string | null } | null } | null;
};

export function isRentalCategory(category?: CategoryRef | null) {
  if (!category?.slug) return false;
  if (category.slug === RENTAL_ROOT_SLUG) return true;
  if (category.parent?.slug === RENTAL_ROOT_SLUG) return true;
  if (category.parent?.parent?.slug === RENTAL_ROOT_SLUG) return true;
  return RENTAL_SUB_SLUGS.has(category.slug);
}

export function isRentalListing(listing?: Pick<Listing, "category"> | null) {
  return isRentalCategory(listing?.category);
}

export function rentalItemRates(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const currency = service.currency || "USD";
  const hourly = fieldNumber(service.fieldValues, "price_hourly");
  const daily = fieldNumber(service.fieldValues, "price_daily") ?? (service.pricingType === "daily" ? Number(service.price) : null);
  const weekly = fieldNumber(service.fieldValues, "price_weekly");
  const monthly = fieldNumber(service.fieldValues, "price_monthly");
  const deposit = fieldNumber(service.fieldValues, "security_deposit");
  const fallback = Number(service.price) || 0;
  const from = [hourly, daily, weekly, monthly].filter((value): value is number => value != null && value > 0);
  return {
    hourly,
    daily: daily && daily > 0 ? daily : service.pricingType === "daily" ? fallback : daily,
    weekly,
    monthly,
    deposit,
    from: from.length ? Math.min(...from) : fallback,
    currency,
  };
}

export function formatRentalMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatRentalFrom(service: Pick<Service, "price" | "currency" | "pricingType" | "fieldValues">) {
  const rates = rentalItemRates(service);
  const unit = rates.hourly != null && rates.hourly === rates.from ? "hr" : "day";
  return `From ${formatRentalMoney(rates.from, rates.currency)} / ${unit}`;
}

export function rentalAvailability(service: Pick<Service, "fieldValues">) {
  return displayValue(fieldByKey(service.fieldValues, "rental_availability")?.value) || null;
}

export function rentalQuantity(service: Pick<Service, "fieldValues">) {
  return fieldNumber(service.fieldValues, "quantity");
}

export type RentalHighlight = { kind: "check"; label: string };

export function rentalShopHighlights(listingFields?: FieldValue[]): RentalHighlight[] {
  const items: RentalHighlight[] = [];
  if (fieldByKey(listingFields, "delivery_available")?.value === true) {
    items.push({ kind: "check", label: "Delivery available" });
  }
  if (fieldByKey(listingFields, "id_proof_required")?.value === true) {
    items.push({ kind: "check", label: "ID proof required" });
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

export function rentalPreviewTags(listingFields?: FieldValue[]) {
  return rentalShopHighlights(listingFields).map((item) => item.label);
}

export function hireDaysBetween(hireFrom: string, hireTo: string) {
  if (!hireFrom || !hireTo || hireTo < hireFrom) return 0;
  const start = new Date(`${hireFrom}T00:00:00`).getTime();
  const end = new Date(`${hireTo}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export { fieldList, fieldNumber };
