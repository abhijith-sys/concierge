import {
  ELECTRONICS_CATEGORY_SLUG,
  ELECTRONICS_SERVICE_SUBCATEGORY_SLUGS,
} from "../../config/constants.js";

const electronicsServiceSlugs = new Set<string>([...ELECTRONICS_SERVICE_SUBCATEGORY_SLUGS]);

export function isElectronicsRootSlug(slug?: string | null) {
  return slug === ELECTRONICS_CATEGORY_SLUG;
}

/** True for repair / IT (not wholesale electronics shops). */
export function isElectronicsServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && electronicsServiceSlugs.has(slug));
}

export const ELECTRONICS_HIDDEN_PLATFORM_KEYS = new Set([
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

export const ELECTRONICS_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "device_types",
  "languages",
  "cancellation_policy",
  "job_package_type",
  "duration_hours",
  "price_hourly",
  "price_job",
]);
