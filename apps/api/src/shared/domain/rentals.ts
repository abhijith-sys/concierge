import { RENTAL_CATEGORY_SLUG, RENTAL_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const rentalSlugs = new Set<string>([RENTAL_CATEGORY_SLUG, ...RENTAL_SUBCATEGORY_SLUGS]);

export function isRentalRootSlug(slug?: string | null) {
  return slug === RENTAL_CATEGORY_SLUG;
}

export function isRentalCategorySlug(slug?: string | null) {
  return Boolean(slug && rentalSlugs.has(slug));
}

/** Platform keys that do not apply to rental & hire shops. */
export const RENTAL_HIDDEN_PLATFORM_KEYS = new Set([
  "emergency_service",
  "emergency_timing",
  "home_visit",
  "service_radius_km",
  "availability",
  "order_modes",
  "min_order_qty",
  "sells_single_piece",
  "wholesale_available",
  "sample_available",
  "unit",
  "moq",
  "price_bulk",
  "price_piece",
  "lead_time_days",
  "custom_order",
]);
