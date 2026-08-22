import { LOGISTICS_CATEGORY_SLUG, LOGISTICS_SERVICE_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const logisticsServiceSlugs = new Set<string>([...LOGISTICS_SERVICE_SUBCATEGORY_SLUGS]);

export function isLogisticsRootSlug(slug?: string | null) {
  return slug === LOGISTICS_CATEGORY_SLUG;
}

/** True for courier / movers / transport / security (not packing / scrap / fabricator shops). */
export function isLogisticsServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && logisticsServiceSlugs.has(slug));
}

export const LOGISTICS_HIDDEN_PLATFORM_KEYS = new Set([
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

/** Strip these from packing / scrap / fabricator forms under the logistics root. */
export const LOGISTICS_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "coverage_area",
  "packing_available",
  "insurance_available",
  "fleet_size",
  "languages",
  "cancellation_policy",
  "offering_type",
  "vehicle_type",
  "capacity_kg",
  "crew_size",
  "vehicle_count",
  "price_per_km",
  "price_hourly",
  "price_day",
]);
