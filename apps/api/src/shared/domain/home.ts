import { HOME_CATEGORY_SLUG, HOME_SERVICE_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const homeServiceSlugs = new Set<string>([...HOME_SERVICE_SUBCATEGORY_SLUGS]);

export function isHomeRootSlug(slug?: string | null) {
  return slug === HOME_CATEGORY_SLUG;
}

/** True for electricians / plumbers / etc. (not materials shops). */
export function isHomeServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && homeServiceSlugs.has(slug));
}

export const HOME_HIDDEN_PLATFORM_KEYS = new Set([
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
  "brand",
]);

export const HOME_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "job_types",
  "service_radius_km",
  "languages",
  "cancellation_policy",
  "job_package_type",
  "duration_hours",
  "price_hourly",
  "price_job",
]);
