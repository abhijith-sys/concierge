import { TRAVEL_CATEGORY_SLUG, TRAVEL_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const travelSlugs = new Set<string>([TRAVEL_CATEGORY_SLUG, ...TRAVEL_SUBCATEGORY_SLUGS]);

export function isTravelRootSlug(slug?: string | null) {
  return slug === TRAVEL_CATEGORY_SLUG;
}

export function isTravelCategorySlug(slug?: string | null) {
  return Boolean(slug && travelSlugs.has(slug));
}

/** Platform keys that do not apply to taxi / transport operators. */
export const TRAVEL_HIDDEN_PLATFORM_KEYS = new Set([
  "emergency_service",
  "emergency_timing",
  "home_visit",
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
