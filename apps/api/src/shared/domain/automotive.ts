import {
  AUTOMOTIVE_CATEGORY_SLUG,
  AUTOMOTIVE_SERVICE_SUBCATEGORY_SLUGS,
} from "../../config/constants.js";

const automotiveServiceSlugs = new Set<string>([...AUTOMOTIVE_SERVICE_SUBCATEGORY_SLUGS]);

export function isAutomotiveRootSlug(slug?: string | null) {
  return slug === AUTOMOTIVE_CATEGORY_SLUG;
}

/** True for repair / wash / tow (not parts / tyre shops). */
export function isAutomotiveServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && automotiveServiceSlugs.has(slug));
}

export const AUTOMOTIVE_HIDDEN_PLATFORM_KEYS = new Set([
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

export const AUTOMOTIVE_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "vehicle_types",
  "languages",
  "cancellation_policy",
  "job_package_type",
  "duration_hours",
  "price_hourly",
  "price_job",
]);
