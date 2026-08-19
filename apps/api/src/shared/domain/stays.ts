import { STAY_CATEGORY_SLUG, STAY_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const staySlugs = new Set<string>([STAY_CATEGORY_SLUG, ...STAY_SUBCATEGORY_SLUGS]);

export function isStayRootSlug(slug?: string | null) {
  return slug === STAY_CATEGORY_SLUG;
}

export function isStayCategorySlug(slug?: string | null) {
  return Boolean(slug && staySlugs.has(slug));
}

/** Platform keys that do not apply to hotels / resorts / stays. */
export const STAY_HIDDEN_PLATFORM_KEYS = new Set([
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
  "service_area",
  "unit",
  "moq",
  "price_bulk",
  "price_piece",
  "lead_time_days",
  "custom_order",
]);
